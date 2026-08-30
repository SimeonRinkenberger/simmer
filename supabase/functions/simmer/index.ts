// Simmer — personal recipe-video library.
// One function serves everything under /functions/v1/simmer:
//   GET  /                    the web app (HTML)
//   GET  /icon.png            app icon
//   GET  /manifest.webmanifest
//   POST /api/ingest          { url } — called by the iOS Shortcut
//   GET  /api/recipes         list all
//   PATCH /api/recipes/:id    edit fields (title, category, favorite, ...)
//   DELETE /api/recipes/:id
// All /api routes require the shared key (?key= or x-app-key header).

import { PAGE_HTML } from "./page.ts";
import { ICON_B64 } from "./icon.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_KEY = Deno.env.get("APP_KEY") ?? "";
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const CLAUDE_MODEL = Deno.env.get("CLAUDE_MODEL") ?? "claude-haiku-4-5-20251001";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") ?? "gemini-3.6-flash";

const DESKTOP_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const CRAWLER_UA = "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";

const CATEGORIES = [
  "Breakfast", "Lunch", "Dinner", "Dessert", "Snack",
  "Drink", "Sauce & Dip", "Baking", "Other",
];

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-app-key",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "content-type": "application/json; charset=utf-8" },
  });
}

// ---------- tiny HTML helpers ----------

function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ");
}

function metaTag(html: string, prop: string): string | null {
  const re1 = new RegExp(`<meta[^>]+property="${prop}"[^>]+content="([^"]*)"`, "i");
  const re2 = new RegExp(`<meta[^>]+content="([^"]*)"[^>]+property="${prop}"`, "i");
  const m = html.match(re1) ?? html.match(re2);
  return m ? decodeEntities(m[1]) : null;
}

// ---------- URL parsing ----------

type Parsed = {
  platform: "instagram" | "tiktok";
  shortcode: string;   // unique key (tiktok ids prefixed tt-)
  kind: string;        // reel | p | tv | video
  clean: string;       // canonical link
};

function matchInstagram(u: string): Parsed | null {
  const m = u.match(/instagram\.com\/(?:[A-Za-z0-9_.]+\/)?(reel|reels|p|tv)\/([A-Za-z0-9_-]+)/);
  if (!m) return null;
  const kind = m[1] === "reels" ? "reel" : m[1];
  return {
    platform: "instagram",
    shortcode: m[2],
    kind,
    clean: `https://www.instagram.com/${kind}/${m[2]}/`,
  };
}

function matchTikTok(u: string): Parsed | null {
  const m = u.match(/tiktok\.com\/(?:@[^/]+\/video|v)\/(\d+)/);
  if (!m) return null;
  return {
    platform: "tiktok",
    shortcode: `tt-${m[1]}`,
    kind: "video",
    clean: u.split("?")[0],
  };
}

async function resolveShare(raw: string): Promise<Parsed | null> {
  const urlMatch = raw.match(/https?:\/\/[^\s"'<>]+/);
  if (!urlMatch) return null;
  let target = urlMatch[0];

  let parsed = matchInstagram(target) ?? matchTikTok(target);
  if (parsed) return parsed;

  // Short/share links (instagram.com/share/..., vm.tiktok.com/...): follow redirects.
  for (let hop = 0; hop < 4 && !parsed; hop++) {
    let loc: string | null = null;
    try {
      const r = await fetch(target, {
        redirect: "manual",
        headers: { "User-Agent": DESKTOP_UA, "Accept-Language": "en-US" },
      });
      loc = r.headers.get("location");
      await r.body?.cancel();
    } catch (_) { break; }
    if (!loc) break;
    target = new URL(loc, target).toString();
    // login redirects carry the real path in ?next=
    const next = new URL(target).searchParams.get("next");
    parsed = matchInstagram(target) ?? matchTikTok(target) ??
      (next ? matchInstagram("https://www.instagram.com" + next) : null);
  }
  return parsed;
}

// ---------- metadata scraping ----------

type Meta = { caption: string | null; thumb: string | null; author: string | null };

async function igMeta(p: Parsed): Promise<Meta> {
  let caption: string | null = null;
  let thumb: string | null = null;
  let author: string | null = null;

  // 1) og: tags, served to link-preview crawlers
  try {
    const r = await fetch(p.clean, {
      headers: { "User-Agent": CRAWLER_UA, "Accept-Language": "en-US", "Accept": "text/html" },
    });
    if (r.ok) {
      const html = await r.text();
      thumb = metaTag(html, "og:image");
      const ogTitle = metaTag(html, "og:title");        // `Chef on Instagram: "caption"`
      const ogDesc = metaTag(html, "og:description");   // `12K likes, 3 comments - chef on date: "caption"`
      const quoted = (s: string | null) => s?.match(/: ["“]([\s\S]*?)["”]?\s*$/)?.[1]?.trim() ?? null;
      const candidates = [quoted(ogTitle), quoted(ogDesc)].filter((c): c is string => !!c);
      caption = candidates.sort((a, b) => b.length - a.length)[0] ?? null;
      if (!caption && ogDesc) {
        caption = ogDesc.replace(/^[\d.,KMB]+ likes?,\s*[\d.,KMB]+ comments?\s*-\s*\S+\s+on\s+[^:]+:\s*/i, "").trim();
      }
      author = ogTitle?.match(/^([^|:]+?) on Instagram/)?.[1]?.trim() ?? null;
    }
  } catch (_) { /* fall through */ }

  // 2) the captioned-embed page often works when og: tags are login-walled
  try {
    const r = await fetch(`https://www.instagram.com/p/${p.shortcode}/embed/captioned/`, {
      headers: { "User-Agent": DESKTOP_UA, "Accept-Language": "en-US" },
    });
    if (r.ok) {
      const html = await r.text();
      if (!thumb) {
        const im = html.match(/class="EmbeddedMediaImage"[^>]*src="([^"]+)"/) ??
          html.match(/src="(https:\/\/[^"]*scontent[^"]+)"/);
        if (im) thumb = decodeEntities(im[1]);
      }
      const capDiv = html.match(/<div class="Caption"[^>]*>([\s\S]*?)<div class="CaptionComments"/) ??
        html.match(/<div class="Caption"[^>]*>([\s\S]*?)<\/div>/);
      if (capDiv) {
        const text = decodeEntities(
          capDiv[1].replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " "),
        ).replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
        if (text && (!caption || text.length > caption.length)) caption = text;
      }
      if (!author) {
        const a = html.match(/class="UsernameText"[^>]*>([^<]+)</);
        if (a) author = decodeEntities(a[1]);
      }
    }
  } catch (_) { /* fall through */ }

  return { caption, thumb, author };
}

async function ttMeta(p: Parsed): Promise<Meta> {
  try {
    const r = await fetch(
      `https://www.tiktok.com/oembed?url=${encodeURIComponent(p.clean)}`,
      { headers: { "User-Agent": DESKTOP_UA } },
    );
    if (r.ok) {
      const o = await r.json();
      return {
        caption: o.title ?? null,
        thumb: o.thumbnail_url ?? null,
        author: o.author_name ?? null,
      };
    }
  } catch (_) { /* fall through */ }
  return { caption: null, thumb: null, author: null };
}

// ---------- Claude: caption -> recipe card ----------

type Card = {
  title: string; category: string; cuisine: string | null;
  ingredients: string[]; steps: string[]; tags: string[]; has_full_recipe: boolean;
};

// ----- free, no-AI parser (always available; also the safety net under the AI) -----

const ING_HEADER = /^[^a-zA-Z]*(ingredients?|you.?ll need|what you need|grocery list)\b/i;
const STEP_HEADER = /^[^a-zA-Z]*(method|instructions?|directions?|steps|how to|preparation|to make)\b/i;
const SPAM_LINE = /^#|follow (me|for)|link in bio|save this|comment ["'“]?\w+["'”]? (below|to get)/i;
const QTY_LINE = new RegExp(
  "^(?:[-•*▢☐✅✔️◽▪️👉➡️\\s]|\\d+[.)]\\s)*\\s*\\d[\\d\\s/.,-]*\\s*(?:g|kg|grams?|ml|l|oz|ounces?|lbs?|pounds?|cups?|tbsps?|tablespoons?|tsps?|teaspoons?|cloves?|cans?|sticks?|slices?|pieces?|pinch|dash|handful|eggs?|scoops?)\\b",
  "i",
);

function cleanLine(s: string): string {
  return s
    .replace(/^[\s\-–—•*▢☐✅✔️◽▪️👉➡️🔸🔹]+/u, "")
    .replace(/[\p{Extended_Pictographic}️‍]/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function cleanTitle(s: string): string {
  const t = cleanLine(s)
    .replace(/#\w+/g, "").replace(/@[\w.]+/g, "")
    .replace(/^[\s:;,.!|~*-]+|[\s:;,.!|~*-]+$/g, "")
    .trim();
  return t.slice(0, 100);
}

function catFor(text: string): string | null {
  const t = text.toLowerCase();
  const rules: Array<[string, RegExp]> = [
    ["Drink", /\b(smoothie|juice|latte|cocktail|mocktail|coffee|matcha|lemonade|milkshake|shake|tea)\b/],
    ["Sauce & Dip", /\b(sauce|dip|dressing|salsa|pesto|marinade|hummus|aioli|gravy)\b/],
    ["Baking", /\b(sourdough|bread|muffins?|cookies?|brownies?|bagels?|croissants?|dough|scones?|banana bread|cinnamon rolls?)\b/],
    ["Dessert", /\b(dessert|ice cream|cheesecake|pudding|tiramisu|mousse|cakes?|tarts?|sweet treat|chocolate)\b/],
    ["Breakfast", /\b(breakfast|pancakes?|waffles?|oats|oatmeal|granola|french toast|omelette?|scrambled|overnight oats|brunch)\b/],
    ["Snack", /\b(snack|energy balls?|protein bars?|bites|trail mix|popcorn)\b/],
    ["Lunch", /\b(salad|sandwich|wraps?|lunch|toast|soup)\b/],
    ["Dinner", /\b(pasta|chicken|beef|pork|salmon|shrimp|steak|curry|stir.?fry|tacos?|burgers?|pizza|risotto|lasagna|meatballs?|casserole|dinner|noodles?|rice bowl|enchiladas?)\b/],
  ];
  for (const [cat, re] of rules) if (re.test(t)) return cat;
  return null;
}

function cuisineFor(text: string): string | null {
  const t = text.toLowerCase();
  const rules: Array<[string, RegExp]> = [
    ["Italian", /\b(pasta|risotto|lasagna|parmesan|carbonara|gnocchi|italian)\b/],
    ["Mexican", /\b(tacos?|burritos?|quesadillas?|enchiladas?|salsa|mexican)\b/],
    ["Japanese", /\b(ramen|sushi|teriyaki|miso|japanese|katsu)\b/],
    ["Thai", /\b(pad thai|thai|tom yum)\b/],
    ["Indian", /\b(masala|tikka|dal|paneer|indian|butter chicken)\b/],
    ["Korean", /\b(kimchi|gochujang|bulgogi|korean|bibimbap)\b/],
    ["Chinese", /\b(dumplings?|fried rice|chow mein|szechuan|chinese|wonton)\b/],
    ["Mediterranean", /\b(hummus|falafel|tzatziki|gyro|mediterranean|greek)\b/],
    ["French", /\b(croissants?|french onion|ratatouille|crepes?|french)\b/],
  ];
  for (const [c, re] of rules) if (re.test(t)) return c;
  return null;
}

function heuristicCard(caption: string | null, author: string | null): Card {
  const empty: Card = {
    title: author ? `Recipe from ${author}` : "Saved recipe",
    category: "Other", cuisine: null,
    ingredients: [], steps: [], tags: [], has_full_recipe: false,
  };
  if (!caption) return empty;

  const lines = caption.split("\n").map((l) => l.trim());

  // title: first meaningful line that isn't a section header
  let title = "";
  for (const l of lines) {
    if (!l || ING_HEADER.test(l) || STEP_HEADER.test(l) || SPAM_LINE.test(l)) continue;
    title = cleanTitle(l);
    if (title.length >= 3) break;
  }
  if (!title) title = empty.title;

  const ingHdr = lines.findIndex((l) => ING_HEADER.test(l));
  const stepHdr = lines.findIndex((l) => STEP_HEADER.test(l));

  const ingredients: string[] = [];
  if (ingHdr >= 0) {
    const stop = stepHdr > ingHdr ? stepHdr : lines.length;
    for (let i = ingHdr + 1; i < stop && ingredients.length < 40; i++) {
      const l = cleanLine(lines[i]);
      if (!l) continue;
      if (SPAM_LINE.test(lines[i]) || STEP_HEADER.test(lines[i])) break;
      if (l.length > 140) break; // hit prose, section is over
      ingredients.push(l);
    }
  } else {
    for (const raw of lines) {
      const l = cleanLine(raw);
      if (l && l.length <= 140 && QTY_LINE.test(raw)) ingredients.push(l);
      if (ingredients.length >= 40) break;
    }
    if (ingredients.length < 3) ingredients.length = 0; // too weak a signal
  }

  const steps: string[] = [];
  if (stepHdr >= 0) {
    for (let i = stepHdr + 1; i < lines.length && steps.length < 30; i++) {
      const raw = lines[i];
      if (SPAM_LINE.test(raw)) break;
      const l = cleanLine(raw).replace(/^(?:step\s*)?\d+\s*[.):-]\s*/i, "");
      if (l) steps.push(l.slice(0, 400));
    }
  } else {
    for (const raw of lines) {
      if (/^\d+[.)]\s+\D/.test(raw) && !QTY_LINE.test(raw)) {
        steps.push(cleanLine(raw).replace(/^\d+\s*[.)]\s*/, "").slice(0, 400));
      }
    }
    if (steps.length < 2) steps.length = 0;
  }

  const genericTags = new Set(["food", "foodie", "recipe", "recipes", "fyp", "viral", "cooking", "yum", "yummy", "instafood", "reels", "explore", "foodtok", "easyrecipes"]);
  const tags = [...caption.matchAll(/#(\w{2,30})/g)]
    .map((m) => m[1].toLowerCase())
    .filter((t) => !genericTags.has(t))
    .slice(0, 5);

  return {
    title,
    category: catFor(title) ?? catFor(caption) ?? "Other",
    cuisine: cuisineFor(title) ?? cuisineFor(caption),
    ingredients, steps, tags,
    has_full_recipe: ingredients.length >= 3 && steps.length >= 2,
  };
}

// ----- AI extraction: Claude if ANTHROPIC_API_KEY is set, else Gemini if GEMINI_API_KEY is set -----

function buildPrompt(caption: string, author: string | null, platform: string) {
  const system =
    `You turn social-media cooking video captions into recipe cards. ` +
    `Reply with ONLY a JSON object (no markdown fences, no commentary) with exactly these keys:\n` +
    `"title": short dish name in Title Case, no emojis or hashtags;\n` +
    `"category": one of ${JSON.stringify(CATEGORIES)} (closest fit; drinks/smoothies -> "Drink"; cookies/cakes/bread -> "Baking" unless clearly "Dessert" plated);\n` +
    `"cuisine": e.g. "Italian", "Thai", or null if unclear;\n` +
    `"ingredients": array of strings with quantities when given, e.g. "2 cups flour" ([] if the caption has none);\n` +
    `"steps": array of short instruction strings ([] if the caption has none);\n` +
    `"tags": up to 5 lowercase tags like "high-protein", "airfryer", "15-min";\n` +
    `"has_full_recipe": true only if both ingredients and steps are substantially present.\n` +
    `Never invent ingredients or steps that are not in the caption. Keep the caption's language.`;
  const user = `Caption from a ${platform} video${author ? ` by ${author}` : ""}:\n"""\n${caption.slice(0, 6000)}\n"""`;
  return { system, user };
}

function normalizeCard(raw: Record<string, unknown>, base: Card): Card {
  const card = { ...base, ...raw } as Card;
  if (!CATEGORIES.includes(card.category)) card.category = base.category;
  card.ingredients = (card.ingredients ?? []).map(String);
  card.steps = (card.steps ?? []).map(String);
  card.tags = (card.tags ?? []).map(String).slice(0, 5);
  card.title = String(card.title || base.title).slice(0, 120);
  card.cuisine = card.cuisine ? String(card.cuisine) : null;
  return card;
}

function parseJsonLoose(text: string): Record<string, unknown> {
  const cleaned = text.replace(/^```json?\s*/i, "").replace(/```\s*$/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  return JSON.parse(cleaned.slice(start, end + 1));
}

async function parseWithClaude(caption: string, author: string | null, platform: string): Promise<Record<string, unknown> | null> {
  const { system, user } = buildPrompt(caption, author, platform);
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 2000,
      system,
      messages: [
        { role: "user", content: user },
        { role: "assistant", content: "{" },
      ],
    }),
  });
  if (!r.ok) { console.error("anthropic error", r.status, await r.text()); return null; }
  const data = await r.json();
  return parseJsonLoose("{" + (data.content?.[0]?.text ?? ""));
}

async function parseWithGemini(caption: string, author: string | null, platform: string): Promise<Record<string, unknown> | null> {
  const { system, user } = buildPrompt(caption, author, platform);
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: { responseMimeType: "application/json", maxOutputTokens: 4000 },
      }),
    },
  );
  if (!r.ok) { console.error("gemini error", r.status, await r.text()); return null; }
  const data = await r.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
  return parseJsonLoose(text);
}

async function extractCard(caption: string | null, author: string | null, platform: string): Promise<Card> {
  const base = heuristicCard(caption, author);
  if (!caption) return base;
  try {
    let raw: Record<string, unknown> | null = null;
    if (ANTHROPIC_API_KEY) raw = await parseWithClaude(caption, author, platform);
    else if (GEMINI_API_KEY) raw = await parseWithGemini(caption, author, platform);
    if (!raw) return base;
    const card = normalizeCard(raw, base);
    // if the AI came back emptier than the plain parser, keep the parser's findings
    if (!card.ingredients.length && base.ingredients.length) card.ingredients = base.ingredients;
    if (!card.steps.length && base.steps.length) card.steps = base.steps;
    card.has_full_recipe = card.has_full_recipe || base.has_full_recipe;
    return card;
  } catch (e) {
    console.error("extractCard failed, using heuristic card", e);
    return base;
  }
}

// ---------- storage + db ----------

async function storeThumb(shortcode: string, src: string | null): Promise<string | null> {
  if (!src) return null;
  try {
    const r = await fetch(src, { headers: { "User-Agent": DESKTOP_UA } });
    if (!r.ok) return null;
    const buf = await r.arrayBuffer();
    if (buf.byteLength < 500) return null;
    const up = await fetch(`${SUPABASE_URL}/storage/v1/object/thumbs/${shortcode}.jpg`, {
      method: "POST",
      headers: {
        ...authHeaders,
        "content-type": r.headers.get("content-type") ?? "image/jpeg",
        "x-upsert": "true",
      },
      body: buf,
    });
    if (!up.ok) { console.error("thumb upload", up.status, await up.text()); return null; }
    return `${SUPABASE_URL}/storage/v1/object/public/thumbs/${shortcode}.jpg`;
  } catch (e) {
    console.error("storeThumb failed", e);
    return null;
  }
}

// Legacy service keys are JWTs and want a Bearer header; new sb_secret_ keys
// are not JWTs and must be sent as `apikey` only (storage rejects them as Bearer).
const KEY_IS_JWT = SERVICE_KEY.split(".").length === 3;
const authHeaders: Record<string, string> = KEY_IS_JWT
  ? { apikey: SERVICE_KEY, authorization: `Bearer ${SERVICE_KEY}` }
  : { apikey: SERVICE_KEY };

const REST = `${SUPABASE_URL}/rest/v1/recipes`;
const dbHeaders = { ...authHeaders, "content-type": "application/json" };

async function dbSelect(query: string): Promise<any[]> {
  const r = await fetch(`${REST}?${query}`, { headers: dbHeaders });
  if (!r.ok) throw new Error(`db select ${r.status}: ${await r.text()}`);
  return await r.json();
}

async function dbInsert(row: Record<string, unknown>): Promise<any> {
  const r = await fetch(REST, {
    method: "POST",
    headers: { ...dbHeaders, prefer: "return=representation" },
    body: JSON.stringify(row),
  });
  if (!r.ok) throw new Error(`db insert ${r.status}: ${await r.text()}`);
  return (await r.json())[0];
}

// ---------- request handling ----------

function authorized(req: Request, url: URL): boolean {
  if (!APP_KEY) return false;
  const supplied = req.headers.get("x-app-key") ?? url.searchParams.get("key") ?? "";
  return supplied === APP_KEY;
}

async function handleIngest(req: Request): Promise<Response> {
  let shared = "";
  const ct = req.headers.get("content-type") ?? "";
  if (ct.includes("json")) {
    const body = await req.json().catch(() => ({}));
    shared = String(body.url ?? body.text ?? "");
  } else {
    shared = await req.text();
  }

  const parsed = await resolveShare(shared);
  if (!parsed) {
    return json({ status: "error", message: "No Instagram/TikTok link found in what was shared." });
  }

  const existing = await dbSelect(`shortcode=eq.${encodeURIComponent(parsed.shortcode)}&select=id,title,category`);
  if (existing.length > 0) {
    return json({
      status: "exists", id: existing[0].id, title: existing[0].title, category: existing[0].category,
      message: `Already saved: ${existing[0].title}`,
    });
  }

  const meta = parsed.platform === "instagram" ? await igMeta(parsed) : await ttMeta(parsed);
  const card = await extractCard(meta.caption, meta.author, parsed.platform);
  const thumb = await storeThumb(parsed.shortcode, meta.thumb);

  const row = await dbInsert({
    url: parsed.clean,
    shortcode: parsed.shortcode,
    platform: parsed.platform,
    kind: parsed.kind,
    author: meta.author,
    title: card.title,
    caption: meta.caption,
    thumb_url: thumb,
    category: card.category,
    cuisine: card.cuisine,
    ingredients: card.ingredients,
    steps: card.steps,
    tags: card.tags,
    has_full_recipe: card.has_full_recipe,
  });

  return json({
    status: "saved", id: row.id, title: row.title, category: row.category,
    message: `Saved: ${row.title} → ${row.category}`,
  });
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  let sub = url.pathname;
  const i = sub.indexOf("/simmer");
  if (i >= 0) sub = sub.slice(i + "/simmer".length);
  if (sub === "" || sub === "/") sub = "/";

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  try {
    if (req.method === "HEAD" && (sub === "/" || sub === "/icon.png")) {
      return new Response(null, {
        headers: { ...CORS, "content-type": sub === "/" ? "text/html; charset=utf-8" : "image/png" },
      });
    }

    if (req.method === "GET" && sub === "/") {
      return new Response(PAGE_HTML, {
        headers: { ...CORS, "content-type": "text/html; charset=utf-8", "cache-control": "no-cache" },
      });
    }

    if (req.method === "GET" && sub === "/icon.png") {
      const bytes = Uint8Array.from(atob(ICON_B64), (c) => c.charCodeAt(0));
      return new Response(bytes, {
        headers: { ...CORS, "content-type": "image/png", "cache-control": "public, max-age=86400" },
      });
    }

    if (req.method === "GET" && sub === "/manifest.webmanifest") {
      return new Response(JSON.stringify({
        name: "Simmer", short_name: "Simmer", display: "standalone",
        background_color: "#FAF6F1", theme_color: "#E1572F",
        icons: [{ src: "icon.png", sizes: "512x512", type: "image/png" }],
      }), { headers: { ...CORS, "content-type": "application/manifest+json" } });
    }

    if (sub.startsWith("/api/")) {
      if (!authorized(req, url)) return json({ status: "error", message: "Bad or missing key." }, 401);

      if (req.method === "POST" && sub === "/api/ingest") return await handleIngest(req);

      if (req.method === "GET" && sub === "/api/recipes") {
        const rows = await dbSelect("select=*&order=created_at.desc&limit=500");
        return json(rows);
      }

      const idMatch = sub.match(/^\/api\/recipes\/([0-9a-f-]{36})$/);
      if (idMatch && req.method === "PATCH") {
        const body = await req.json().catch(() => ({}));
        const allowed = ["title", "category", "cuisine", "favorite", "ingredients", "steps", "tags"];
        const patch: Record<string, unknown> = {};
        for (const k of allowed) if (k in body) patch[k] = body[k];
        const r = await fetch(`${REST}?id=eq.${idMatch[1]}`, {
          method: "PATCH",
          headers: { ...dbHeaders, prefer: "return=representation" },
          body: JSON.stringify(patch),
        });
        if (!r.ok) throw new Error(`db patch ${r.status}: ${await r.text()}`);
        return json((await r.json())[0] ?? {});
      }
      if (idMatch && req.method === "DELETE") {
        const r = await fetch(`${REST}?id=eq.${idMatch[1]}`, { method: "DELETE", headers: dbHeaders });
        if (!r.ok) throw new Error(`db delete ${r.status}: ${await r.text()}`);
        return json({ status: "deleted" });
      }
    }

    return json({ status: "error", message: "Not found." }, 404);
  } catch (e) {
    console.error("unhandled", e);
    return json({ status: "error", message: `Something went wrong: ${e instanceof Error ? e.message : e}` }, 500);
  }
});
