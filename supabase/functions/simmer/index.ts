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
const GOOGLE_CSE_KEY = Deno.env.get("GOOGLE_CSE_KEY") ?? "";
const GOOGLE_CSE_ID = Deno.env.get("GOOGLE_CSE_ID") ?? "";
const TAVILY_API_KEY = Deno.env.get("TAVILY_API_KEY") ?? "";

const DESKTOP_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const CRAWLER_UA = "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";

const CATEGORIES = [
  "Breakfast", "Lunch", "Dinner", "Meal Prep", "Dessert", "Snack",
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

type Meta = { caption: string | null; thumb: string | null; author: string | null; images?: string[] };

// ---- Gemini with model rotation: free-tier daily caps are tiny (20/day) PER MODEL ----
const GEMINI_MODELS = [...new Set([GEMINI_MODEL, "gemini-3.6-flash-lite", "gemini-3-flash-lite", "gemini-3-flash", "gemini-flash-latest"])];
let geminiGoodModel: string | null = null;

async function geminiGenerate(body: Record<string, unknown>): Promise<string | null> {
  if (!GEMINI_API_KEY) return null;
  const models = geminiGoodModel
    ? [geminiGoodModel, ...GEMINI_MODELS.filter((m) => m !== geminiGoodModel)]
    : GEMINI_MODELS;
  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
        body: JSON.stringify(body),
      });
      if (r.status === 429 && attempt === 0) {
        await r.body?.cancel();
        await new Promise((res) => setTimeout(res, 2500));
        continue;
      }
      if (r.status === 429 || r.status === 404) {
        console.error("gemini", model, r.status, "— rotating to next model");
        await r.body?.cancel();
        if (geminiGoodModel === model) geminiGoodModel = null;
        break;
      }
      if (!r.ok) { console.error("gemini", model, r.status, await r.text()); return null; }
      const data = await r.json();
      geminiGoodModel = model;
      return data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
    }
  }
  console.error("gemini: all models exhausted");
  return null;
}

async function igMeta(p: Parsed): Promise<Meta> {
  let caption: string | null = null;
  let thumb: string | null = null;
  let author: string | null = null;
  let images: string[] = [];

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
        // og: tags collapse newlines; a caption WITH line structure beats a longer flat one
        const structured = text.includes("\n") && !(caption ?? "").includes("\n");
        if (text && (!caption || structured || text.length > caption.length)) caption = text;
      }
      if (!author) {
        const a = html.match(/class="UsernameText"[^>]*>([^<]+)</);
        if (a) author = decodeEntities(a[1]);
      }
      // carousel posts: the embed page's inline JSON exposes display_url for every slide
      for (const mm of html.matchAll(/"display_url"\s*:\s*"([^"]+)"/g)) {
        const u = mm[1].replace(/\\u0026/g, "&").replace(/\\\//g, "/");
        if (/^https:\/\//.test(u) && !images.includes(u)) images.push(u);
      }
    }
  } catch (_) { /* fall through */ }

  if (!images.length && thumb) images = [thumb];
  return { caption, thumb, author, images };
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

type SubRecipe = { title: string; ingredients: string[]; steps: string[] };
type Card = {
  title: string; category: string; cuisine: string | null;
  ingredients: string[]; steps: string[]; tags: string[]; has_full_recipe: boolean;
  sub_recipes?: SubRecipe[];
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

// "2 cups flour, sifted" -> "flour": the key the grocery list combines on
function normalizeItem(text: string): string {
  let s = text.toLowerCase();
  s = s.replace(/\(.*?\)/g, " ");            // "(28 ounce)"
  s = s.split(/,| - | – |;/)[0];             // ", sliced"
  const UNITS = "cups?|tbsps?|tablespoons?|tsps?|teaspoons?|grams?|g|kg|ml|l|liters?|oz|ounces?|lbs?|pounds?|cloves?|cans?|sticks?|slices?|pieces?|pinch(?:es)?|dash(?:es)?|handfuls?|scoops?|packages?|pkgs?|containers?|jars?|bottles?|bunch(?:es)?|heads?|stalks?|sprigs?|large|medium|small|extra[- ]large";
  s = s.replace(new RegExp("^(?:(?:about|approx\\.?|roughly|heaping|scant)\\s+)?[\\d\\s/.,-]*\\s*(?:" + UNITS + ")?\\s*(?:of\\s+)?", "i"), "");
  s = s.replace(/[\d/]+/g, " ").replace(/\bto taste\b/g, "").replace(/\s{2,}/g, " ").trim();
  return s || text.toLowerCase().trim();
}

function catFor(text: string): string | null {
  const t = text.toLowerCase();
  const rules: Array<[string, RegExp]> = [
    ["Meal Prep", /\b(meal.?preps?|meal.?prepping)\b/],
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

  let lines = caption.split("\n").map((l) => l.trim());
  // og: captions sometimes arrive with newlines collapsed — recover structure from bullet dashes
  if (lines.length < 4 && caption.length > 200) {
    lines = caption.split(/\s+[-•▪]\s+/).map((l) => l.trim());
  }

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

  const finalSteps = splitLongSteps(steps);
  return {
    title,
    category: catFor(title) ?? catFor(caption) ?? "Other",
    cuisine: cuisineFor(title) ?? cuisineFor(caption),
    ingredients, steps: finalSteps, tags,
    has_full_recipe: ingredients.length >= 3 && finalSteps.length >= 2,
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
    `"has_full_recipe": true only if both ingredients and steps are substantially present;\n` +
    `"sub_recipes": [] normally — BUT if the caption contains MULTIPLE distinct recipes (a meal-prep video, "5 dinners this week", etc.), ` +
    `set "category" to "Meal Prep", leave the top-level "ingredients" and "steps" empty, and instead put each recipe into "sub_recipes" ` +
    `as {"title": dish name, "ingredients": [...], "steps": [...]} in the order they appear.\n` +
    `Never invent ingredients or steps that are not in the caption. Keep the caption's language.`;
  const user = `Caption from a ${platform} video${author ? ` by ${author}` : ""}:\n"""\n${caption.slice(0, 6000)}\n"""`;
  return { system, user };
}

// Some sources jam the whole method into one giant "step" — split it back up.
function splitLongSteps(steps: string[]): string[] {
  const out: string[] = [];
  for (const s of steps) {
    if (s.length <= 260) { out.push(s); continue; }
    let parts = s.split(/\s*(?:\r?\n)+\s*/).filter(Boolean);
    if (parts.length < 2) {
      parts = s.split(/\s+(?=\d+[.)]\s)/).map((p) => p.replace(/^\d+[.)]\s*/, "")).filter(Boolean);
    }
    if (parts.length < 2) {
      const sentences = s.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) ?? [s];
      let cur = "";
      parts = [];
      for (const sent of sentences) {
        if ((cur + sent).length > 220 && cur) { parts.push(cur.trim()); cur = sent; }
        else cur += sent;
      }
      if (cur.trim()) parts.push(cur.trim());
    }
    for (const p of parts) { const t = p.trim(); if (t) out.push(t); }
  }
  return out.slice(0, 40);
}

function normalizeCard(raw: Record<string, unknown>, base: Card): Card {
  const card = { ...base, ...raw } as Card;
  if (!CATEGORIES.includes(card.category)) card.category = base.category;
  card.ingredients = (card.ingredients ?? []).map(String);
  card.steps = splitLongSteps((card.steps ?? []).map(String));
  card.tags = (card.tags ?? []).map(String).slice(0, 5);
  card.title = String(card.title || base.title).slice(0, 120);
  card.cuisine = card.cuisine ? String(card.cuisine) : null;
  const rawSubs = (raw as { sub_recipes?: unknown }).sub_recipes;
  card.sub_recipes = Array.isArray(rawSubs)
    ? rawSubs.slice(0, 12).map((s: Record<string, unknown>) => ({
        title: String(s?.title ?? "").slice(0, 120),
        ingredients: Array.isArray(s?.ingredients) ? s.ingredients.map(String).slice(0, 60) : [],
        steps: Array.isArray(s?.steps) ? splitLongSteps(s.steps.map(String)) : [],
      })).filter((s) => s.ingredients.length || s.steps.length)
    : (base.sub_recipes ?? []);
  if (card.sub_recipes.length > 0) {
    card.category = "Meal Prep";
    card.has_full_recipe = true;
  }
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
  const text = await geminiGenerate({
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts: [{ text: user }] }],
    generationConfig: { responseMimeType: "application/json", maxOutputTokens: 4000 },
  });
  return text ? parseJsonLoose(text) : null;
}

// When the caption has no recipe ("comment RECIPE", "it's on my blog"), let Gemini
// search the web for the recipe the video refers to. Free tier includes grounded search.
async function findRecipeOnline(
  title: string, caption: string | null, author: string | null,
): Promise<(Card & { source_url: string | null }) | null> {
  if (!GEMINI_API_KEY) return null;
  const system =
    `A cooking video does not include its recipe in the caption. Use Google Search to find the exact recipe it refers to. ` +
    `Search with the dish name plus the creator's name; if the caption names a website, blog, or search phrase, use that hint. ` +
    `If the exact source cannot be found, use the closest well-reviewed recipe for the same dish. ` +
    `Reply with ONLY a JSON object (no markdown fences) with keys: ` +
    `"title" (short dish name in Title Case), "category" (one of ${JSON.stringify(CATEGORIES)}), "cuisine" (string or null), ` +
    `"ingredients" (array of strings with quantities), "steps" (array of short instruction strings), ` +
    `"tags" (up to 5 lowercase strings), "has_full_recipe" (true only if ingredients AND steps are complete), ` +
    `"source_url" (the exact page URL the recipe came from, or null).`;
  const user = `Video by ${author ?? "an unknown creator"}: "${title}"\nCaption:\n"""\n${(caption ?? "").slice(0, 3000)}\n"""`;
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        tools: [{ google_search: {} }], // JSON response mode can't combine with tools; parse loosely below
        generationConfig: { maxOutputTokens: 4000 },
      }),
    },
  );
  if (!r.ok) { console.error("gemini search error", r.status, await r.text()); return null; }
  const data = await r.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
  try {
    const raw = parseJsonLoose(text);
    const su = typeof raw.source_url === "string" && /^https?:\/\//.test(raw.source_url) ? raw.source_url : null;
    const card = normalizeCard(raw, {
      title, category: "Other", cuisine: null, ingredients: [], steps: [], tags: [], has_full_recipe: false,
    });
    return { ...card, source_url: su };
  } catch (e) {
    console.error("gemini search parse failed", e);
    return null;
  }
}

// Plan B when Gemini's grounded search is quota-limited: search DuckDuckGo ourselves,
// fetch the top results, and read the schema.org Recipe JSON-LD that recipe blogs embed.
const SOCIAL_RE = /instagram\.com|tiktok\.com|youtube\.com|youtu\.be|facebook\.com|pinterest\.|reddit\.com|amazon\./i;

const JUNK_RE = /brave\.com|bravesoftware|duckduckgo\.com|mojeek\.com|searx|imgs\.search|\/\/cdn\.|google\.|gstatic\.|\.(css|js|png|jpe?g|svg|ico|webp|woff2?)(\?|$)/i;

function collectLinks(html: string, linkRe: RegExp): string[] {
  const urls: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(html)) && urls.length < 8) {
    let href = decodeEntities(m[1]);
    const uddg = href.match(/[?&]uddg=([^&]+)/);
    if (uddg) href = decodeURIComponent(uddg[1]);
    if (!/^https?:\/\//.test(href) || SOCIAL_RE.test(href) || JUNK_RE.test(href)) continue;
    if (!urls.includes(href)) urls.push(href);
  }
  return urls;
}

async function webSearch(query: string): Promise<string[]> {
  // Tavily: free 1000 searches/month, works from datacenter IPs. The reliable path.
  if (TAVILY_API_KEY) {
    try {
      const r = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${TAVILY_API_KEY}` },
        body: JSON.stringify({ query, max_results: 8 }),
        signal: AbortSignal.timeout(15000),
      });
      if (r.ok) {
        const data = await r.json();
        const urls = (data.results ?? [])
          .map((x: { url?: string }) => x.url ?? "")
          .filter((u: string) => /^https?:\/\//.test(u) && !SOCIAL_RE.test(u));
        if (urls.length) return urls;
      } else {
        console.error("tavily error", r.status, await r.text());
      }
    } catch (e) {
      console.error("tavily failed", e);
    }
  }
  if (GOOGLE_CSE_KEY && GOOGLE_CSE_ID) {
    try {
      const r = await fetch(
        `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_CSE_KEY}&cx=${GOOGLE_CSE_ID}&num=8&q=${encodeURIComponent(query)}`,
        { signal: AbortSignal.timeout(10000) },
      );
      if (r.ok) {
        const data = await r.json();
        const urls = (data.items ?? [])
          .map((it: { link?: string }) => it.link ?? "")
          .filter((u: string) => /^https?:\/\//.test(u) && !SOCIAL_RE.test(u));
        if (urls.length) return urls;
      } else {
        console.error("google cse error", r.status, await r.text());
      }
    } catch (e) {
      console.error("google cse failed", e);
    }
  }
  const engines: Array<[string, RegExp]> = [
    // DDG blocks datacenter IPs often; Mojeek is scrape-friendly. Try both, first hit wins.
    ["https://search.brave.com/search?q=", /href="(https?:\/\/[^"]+)"/g],
    ["https://www.bing.com/search?q=", /<h2><a[^>]+href="(https?:\/\/[^"]+)"/g],
    ["https://html.duckduckgo.com/html/?q=", /class="result__a"[^>]+href="([^"]+)"/g],
    ["https://www.mojeek.com/search?q=", /class="title"[^>]*href="([^"]+)"/g],
  ];
  for (const [base, re] of engines) {
    // one retry after a pause: Brave 429s under bursts (e.g. saving many recipes at once)
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const r = await fetch(base + encodeURIComponent(query), {
          headers: { "User-Agent": DESKTOP_UA, "Accept-Language": "en-US" },
          signal: AbortSignal.timeout(10000),
        });
        const html = await r.text();
        if (r.status === 429 && attempt === 0) {
          console.error("search engine", base, "429 — retrying in 3s");
          await new Promise((res) => setTimeout(res, 3000));
          continue;
        }
        if (!r.ok || r.status === 202) { console.error("search engine", base, "status", r.status); break; }
        const urls = collectLinks(html, re);
        if (urls.length) return urls;
        console.error("search engine", base, "returned no links");
        break;
      } catch (e) {
        console.error("search engine failed", base, e);
        break;
      }
    }
  }
  return [];
}

// Food blogs are almost all WordPress: /?s=<query> is a built-in site search that
// works even when every external search engine is blocking or rate-limiting us.
async function wpSiteSearch(host: string, title: string): Promise<string[]> {
  try {
    // WordPress search ANDs every term, and captions abbreviate ("parm" won't match
    // "parmesan") — so search with the full-length words only
    const q = (title.toLowerCase().match(/[a-z]{5,}/g) ?? []).slice(0, 5).join(" ") || title;
    const r = await fetch(`https://${host.replace(/^www\./, "")}/?s=${encodeURIComponent(q)}`, {
      headers: { "User-Agent": DESKTOP_UA, "Accept-Language": "en-US" },
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) return [];
    const html = await r.text();
    const re = new RegExp('href="(https?://(?:www\\.)?' + host.replace(/^www\./, "").replace(/\./g, "\\.") + '/[^"]{10,})"', "g");
    const urls: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) && urls.length < 6) {
      const u = decodeEntities(m[1]).split("#")[0];
      if (/\/(category|tag|author|page|feed|comments|wp-)|\?/.test(u)) continue;
      if (!urls.includes(u)) urls.push(u);
    }
    return urls;
  } catch (e) {
    console.error("site search failed", host, e);
    return [];
  }
}

type LdRecipe = { name?: string; ingredients: string[]; steps: string[]; cuisine?: string };

function parseLdRecipes(html: string): LdRecipe[] {
  const out: LdRecipe[] = [];
  const blocks = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)];
  for (const b of blocks) {
    let data: unknown;
    try { data = JSON.parse(b[1].trim()); } catch { continue; }
    const queue: any[] = Array.isArray(data) ? [...data] : [data];
    while (queue.length && out.length < 10) {
      const node = queue.shift();
      if (!node || typeof node !== "object") continue;
      if (Array.isArray(node["@graph"])) queue.push(...node["@graph"]);
      const t = node["@type"];
      if (!(t === "Recipe" || (Array.isArray(t) && t.includes("Recipe")))) continue;
      const ingredients = (node.recipeIngredient ?? node.ingredients ?? [])
        .map((x: unknown) => decodeEntities(String(x)).replace(/\s+/g, " ").trim()).filter(Boolean);
      const steps: string[] = [];
      const walk = (ins: any) => {
        if (!ins) return;
        if (typeof ins === "string") { const s = decodeEntities(ins).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(); if (s) steps.push(s); return; }
        if (Array.isArray(ins)) { ins.forEach(walk); return; }
        if (ins.itemListElement) { walk(ins.itemListElement); return; }
        if (ins.text) { const s = decodeEntities(String(ins.text)).replace(/\s+/g, " ").trim(); if (s) steps.push(s); }
      };
      walk(node.recipeInstructions);
      if (ingredients.length >= 3) {
        out.push({
          name: node.name ? decodeEntities(String(node.name)) : undefined,
          ingredients,
          steps,
          cuisine: Array.isArray(node.recipeCuisine) ? String(node.recipeCuisine[0]) : (node.recipeCuisine ? String(node.recipeCuisine) : undefined),
        });
      }
    }
  }
  return out;
}

// Roundup listicles publish fake Recipe schema ("ingredients" = a list of dish names,
// steps = "pick your favorite from the list above"). Reject those.
function plausibleRecipe(ings: string[], steps: string[]): boolean {
  if (ings.length < 3) return false;
  const withQty = ings.filter((i) =>
    /\d|\b(cups?|tbsps?|tsps?|oz|ounces?|grams?|kg|ml|lbs?|pounds?|cloves?|pinch|dash|cans?|salt|pepper|butter|oil|to taste)\b/i.test(i)).length;
  if (withQty / ings.length < 0.4) return false;
  if (steps.length > 0 && steps.length <= 4 &&
    /favou?rite|list above|recipes? (from|in) th(e|is) list|choose one|roundup/i.test(steps.join(" "))) return false;
  return true;
}

async function findRecipeViaSearch(
  title: string, caption: string | null, author: string | null,
): Promise<(Card & { source_url: string | null }) | null> {
  const siteHint = caption?.match(/(?:www\.)?([a-z0-9-]+\.(?:com|net|org|co|blog|recipes?))\b/i)?.[1] ?? "";
  const query = `${title} recipe ${author ?? ""} ${siteHint}`.replace(/\s+/g, " ").trim();
  let urls = await webSearch(query);
  // the creator's own site (from the caption) is the best possible source — check it first
  if (siteHint) {
    const siteUrls = await wpSiteSearch(siteHint, title);
    urls = [...siteUrls, ...urls.filter((u) => !siteUrls.includes(u))];
  }
  // rank candidates by how many words of the dish name appear in the URL —
  // a creator's site search can put an unrelated recipe first
  const stop = new Set(["the", "and", "with", "for", "recipe", "recipes", "see", "below", "number", "most", "popular", "this", "that", "easy", "best", "how", "make", "made", "from", "video", "creamy", "homemade"]);
  const words = (title.toLowerCase().match(/[a-z]{3,}/g) ?? []).filter((w) => !stop.has(w));
  const score = (s: string) => { const t = s.toLowerCase(); let n = 0; for (const w of words) if (t.includes(w)) n++; return n; };
  const ranked = urls.slice(0, 10)
    .map((u, i) => ({ u, i, s: score(u) }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((x) => x.u);
  console.log("recipe search:", query, "->", urls.length, "candidates; top:", ranked[0] ?? "none");

  let fallback: (Card & { source_url: string | null; confident?: boolean }) | null = null;
  for (const u of ranked.slice(0, 6)) {
    try {
      const r = await fetch(u, { headers: { "User-Agent": DESKTOP_UA }, signal: AbortSignal.timeout(10000) });
      if (!r.ok) continue;
      const recs = parseLdRecipes(await r.text()).filter((rec) => plausibleRecipe(rec.ingredients, rec.steps));
      if (!recs.length) continue;
      const need = Math.min(words.length, 3);

      // a page with several real recipes (a meal-prep blog post) becomes a Meal Prep card
      if (recs.length > 1) {
        const confident = words.length < 2 || score(u) >= need ||
          recs.some((rec) => score(rec.name ?? "") >= need);
        const cardOut = {
          title, category: "Meal Prep", cuisine: null,
          ingredients: [] as string[], steps: [] as string[], tags: [] as string[],
          has_full_recipe: true,
          sub_recipes: recs.slice(0, 12).map((rec, i) => ({
            title: cleanTitle(rec.name ?? "Recipe " + (i + 1)),
            ingredients: rec.ingredients.slice(0, 60),
            steps: splitLongSteps(rec.steps),
          })),
          source_url: u,
          confident,
        };
        if (confident) return cardOut;
        if (!fallback && score(u) >= 1) fallback = cardOut;
        continue;
      }

      const rec = recs[0];
      const t = cleanTitle(rec.name ?? title) || title;
      // accept confidently only when the URL or the recipe's own name really matches the dish
      const confident = words.length < 2 || score(u) >= need || score(rec.name ?? "") >= need;
      const cardOut = {
        title: t,
        category: catFor(t) ?? catFor(title) ?? "Other",
        cuisine: rec.cuisine ?? cuisineFor(t),
        ingredients: rec.ingredients.slice(0, 60),
        steps: splitLongSteps(rec.steps),
        tags: [],
        has_full_recipe: rec.ingredients.length >= 3 && rec.steps.length >= 2,
        source_url: u,
        confident,
      };
      if (confident) return cardOut;
      if (!fallback && score(u) >= 1) fallback = cardOut;
    } catch { /* try next result */ }
  }
  return fallback;
}

// Some posts have the recipe written IN the image (recipe-card slides).
// Gemini Flash reads images on the same free tier.
function b64encode(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}

async function extractFromImage(imgUrl: string, title: string): Promise<Card | null> {
  if (!GEMINI_API_KEY || !imgUrl) return null;
  const ir = await fetch(imgUrl, { headers: { "User-Agent": DESKTOP_UA }, signal: AbortSignal.timeout(10000) });
  if (!ir.ok) return null;
  const buf = await ir.arrayBuffer();
  if (buf.byteLength < 1000 || buf.byteLength > 4_000_000) return null;
  const prompt =
    `If this image contains a written recipe (a recipe card, ingredient list, or instructions as text in the image), extract it. ` +
    `Reply with ONLY a JSON object: {"title": short dish name in Title Case, "category": one of ${JSON.stringify(CATEGORIES)}, ` +
    `"cuisine": string or null, "ingredients": string[] with quantities, "steps": string[], "tags": string[] (max 5), "has_full_recipe": boolean}. ` +
    `If the image does NOT contain a written recipe (it's just food, a person, or a video frame), reply with exactly {"none": true}. Never invent text that is not readable in the image.`;
  const text = await geminiGenerate({
    contents: [{
      role: "user",
      parts: [
        { inline_data: { mime_type: ir.headers.get("content-type") ?? "image/jpeg", data: b64encode(buf) } },
        { text: prompt },
      ],
    }],
    generationConfig: { maxOutputTokens: 4000 },
  });
  if (!text) return null;
  try {
    const raw = parseJsonLoose(text);
    if (raw.none) return null;
    const card = normalizeCard(raw, {
      title, category: "Other", cuisine: null, ingredients: [], steps: [], tags: [], has_full_recipe: false,
    });
    return card.ingredients.length >= 3 ? card : null;
  } catch {
    return null;
  }
}

async function buildCard(meta: Meta, platform: string, kind = "reel"): Promise<{ card: Card; sourceUrl: string | null }> {
  const card = await extractCard(meta.caption, meta.author, platform);
  let sourceUrl: string | null = null;
  // Caption gave us (nearly) nothing — read the post image, or hunt the recipe down on the web.
  if (!card.has_full_recipe && card.ingredients.length < 3 && !(card.sub_recipes ?? []).length) {
    // try every carousel slide (recipe cards are often on photo 2 or 3);
    // several slides with recipes become one Meal Prep card
    const slides = (meta.images?.length ? meta.images : (meta.thumb ? [meta.thumb] : [])).slice(0, 4);
    const fromImage = async (): Promise<Card | null> => {
      const found: Card[] = [];
      for (const img of slides) {
        const c0 = await extractFromImage(img, card.title).catch(() => null);
        if (c0) found.push(c0);
      }
      if (!found.length) return null;
      if (found.length === 1) return found[0];
      return {
        title: card.title, category: "Meal Prep", cuisine: null,
        ingredients: [], steps: [], tags: [], has_full_recipe: true,
        sub_recipes: found.map((f, i) => ({
          title: f.title || "Recipe " + (i + 1),
          ingredients: f.ingredients, steps: f.steps,
        })),
      };
    };
    // grounded Gemini search is paid-only for new free keys — go straight to our own hunt
    const fromWeb = () => findRecipeViaSearch(card.title, meta.caption, meta.author).catch(() => null);
    // photo posts are often recipe-card images; video covers rarely are
    const attempts = kind === "p" ? [fromImage, fromWeb] : [fromWeb, fromImage];
    for (const attempt of attempts) {
      const web = await attempt();
      if (web && (web.sub_recipes ?? []).length > 0) {
        card.sub_recipes = web.sub_recipes;
        card.category = "Meal Prep";
        card.has_full_recipe = true;
        if (!card.tags.length) card.tags = web.tags;
        sourceUrl = (web as Card & { source_url?: string | null }).source_url ?? null;
        break;
      }
      if (web && web.ingredients.length >= 3) {
        card.ingredients = web.ingredients;
        card.steps = web.steps;
        if (!card.cuisine) card.cuisine = web.cuisine;
        if (card.category === "Other") card.category = web.category;
        const shouty = card.title === card.title.toUpperCase() && /[A-Z]/.test(card.title);
        const conf = (web as Card & { confident?: boolean }).confident !== false;
        if (conf && web.title && (card.title === "Saved recipe" || card.title.startsWith("Recipe from ") || card.title.length > 60 || shouty)) {
          card.title = web.title;
        }
        if (!card.tags.length) card.tags = web.tags;
        card.has_full_recipe = web.ingredients.length >= 3 && web.steps.length >= 2;
        sourceUrl = (web as Card & { source_url?: string | null }).source_url ?? null;
        break;
      }
    }
  }
  // caption had the ingredients but no method ("full recipe in video") — fetch just the steps
  if (!(card.sub_recipes ?? []).length && card.ingredients.length >= 3 && card.steps.length === 0) {
    const web = await findRecipeViaSearch(card.title, meta.caption, meta.author).catch(() => null);
    if (web && (web as Card & { confident?: boolean }).confident !== false &&
        web.steps.length >= 2 && !(web.sub_recipes ?? []).length) {
      card.steps = web.steps;
      card.has_full_recipe = card.steps.length >= 2;
      sourceUrl = sourceUrl ?? (web as Card & { source_url?: string | null }).source_url ?? null;
    }
  }
  return { card, sourceUrl };
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
  const { card, sourceUrl } = await buildCard(meta, parsed.platform, parsed.kind);
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
    source_url: sourceUrl,
    sub_recipes: card.sub_recipes ?? [],
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

      // ----- grocery list -----
      const GREST = `${SUPABASE_URL}/rest/v1/grocery_items`;
      if (sub === "/api/grocery") {
        if (req.method === "GET") {
          const r = await fetch(`${GREST}?select=*&order=created_at.asc`, { headers: dbHeaders });
          if (!r.ok) throw new Error(await r.text());
          return json(await r.json());
        }
        if (req.method === "POST") {
          const body = await req.json().catch(() => ({}));
          const items = Array.isArray(body.items) ? body.items : [];
          const rows = items.slice(0, 100).map((it: Record<string, unknown>) => ({
            text: String(it.text ?? "").slice(0, 200),
            item: normalizeItem(String(it.text ?? "")),
            recipe_id: typeof it.recipe_id === "string" && /^[0-9a-f-]{36}$/.test(it.recipe_id) ? it.recipe_id : null,
            recipe_title: it.recipe_title ? String(it.recipe_title).slice(0, 120) : null,
          })).filter((r: { text: string }) => r.text);
          if (!rows.length) return json({ status: "error", message: "No items." });
          const ir = await fetch(GREST, {
            method: "POST",
            headers: { ...dbHeaders, prefer: "return=representation" },
            body: JSON.stringify(rows),
          });
          if (!ir.ok) throw new Error(await ir.text());
          return json({ status: "added", items: await ir.json() });
        }
        if (req.method === "PATCH") {
          const body = await req.json().catch(() => ({}));
          const ids = (Array.isArray(body.ids) ? body.ids : []).filter((x: string) => /^[0-9a-f-]{36}$/.test(x));
          if (!ids.length) return json({ status: "error", message: "No ids." });
          const pr = await fetch(`${GREST}?id=in.(${ids.join(",")})`, {
            method: "PATCH", headers: dbHeaders, body: JSON.stringify({ checked: !!body.checked }),
          });
          if (!pr.ok) throw new Error(await pr.text());
          return json({ status: "ok" });
        }
        if (req.method === "DELETE" && url.searchParams.get("checked") === "true") {
          const dr = await fetch(`${GREST}?checked=eq.true`, { method: "DELETE", headers: dbHeaders });
          if (!dr.ok) throw new Error(await dr.text());
          return json({ status: "cleared" });
        }
      }
      // ----- "what does this step mean?" for beginner cooks -----
      if (req.method === "POST" && sub === "/api/explain") {
        const body = await req.json().catch(() => ({}));
        const step = String(body.step ?? "").slice(0, 500);
        const title = String(body.title ?? "").slice(0, 150);
        if (!step) return json({ status: "error", message: "No step given." });
        if (!GEMINI_API_KEY && !ANTHROPIC_API_KEY) return json({ status: "error", message: "No AI key configured." });
        const system =
          "You are a warm, patient cooking teacher helping a beginner home cook. " +
          "Explain the given recipe instruction in plain, friendly language: what it means, how to actually do it, " +
          "and how to tell when it's done correctly. Mention one common beginner mistake if helpful. " +
          "3-5 short sentences of plain text. No markdown, no lists, no headings.";
        const user = (title ? `Recipe: ${title}\n` : "") + `Instruction: "${step}"`;
        let text = "";
        try {
          if (ANTHROPIC_API_KEY) {
            const r = await fetch("https://api.anthropic.com/v1/messages", {
              method: "POST",
              headers: { "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
              body: JSON.stringify({ model: CLAUDE_MODEL, max_tokens: 500, system, messages: [{ role: "user", content: user }] }),
            });
            if (r.ok) text = (await r.json()).content?.[0]?.text ?? "";
            else console.error("explain anthropic error", r.status, await r.text());
          } else {
            text = (await geminiGenerate({
              systemInstruction: { parts: [{ text: system }] },
              contents: [{ role: "user", parts: [{ text: user }] }],
              generationConfig: { maxOutputTokens: 2000 },
            })) ?? "";
          }
        } catch (e) {
          console.error("explain failed", e);
        }
        if (!text.trim()) return json({ status: "error", message: "Couldn't get an explanation right now — try again." });
        return json({ status: "ok", explanation: text.trim() });
      }

      const gidMatch = sub.match(/^\/api\/grocery\/([0-9a-f-]{36})$/);
      if (gidMatch && req.method === "DELETE") {
        const dr = await fetch(`${GREST}?id=eq.${gidMatch[1]}`, { method: "DELETE", headers: dbHeaders });
        if (!dr.ok) throw new Error(await dr.text());
        return json({ status: "deleted" });
      }

      if (req.method === "GET" && sub === "/api/recipes") {
        const rows = await dbSelect("select=*&order=created_at.desc&limit=500");
        return json(rows);
      }

      const reMatch = sub.match(/^\/api\/recipes\/([0-9a-f-]{36})\/reprocess$/);
      if (reMatch && req.method === "POST") {
        const rows = await dbSelect(`id=eq.${reMatch[1]}&select=*`);
        if (!rows.length) return json({ status: "error", message: "Not found." }, 404);
        const row = rows[0];
        const parsed: Parsed = {
          platform: row.platform as Parsed["platform"],
          shortcode: row.shortcode,
          kind: row.kind ?? "reel",
          clean: row.url,
        };
        const meta = parsed.platform === "instagram" ? await igMeta(parsed) : await ttMeta(parsed);
        if (!meta.caption && row.caption) meta.caption = row.caption; // scraping can be flaky; keep what we had
        if (!meta.author && row.author) meta.author = row.author;
        if (!meta.thumb && row.thumb_url) meta.thumb = row.thumb_url; // reuse cached image for picture-recipes
        const { card, sourceUrl } = await buildCard(meta, parsed.platform, parsed.kind);
        // a re-run must never downgrade: keep the old title if the new one is much longer,
        // the old category if the new run only managed "Other", and the old recipe data
        // if the new run (e.g. during AI quota exhaustion) came back empty-handed
        if (row.title && row.title.length >= 8 && card.title.length > row.title.length + 20) card.title = row.title;
        if (card.category === "Other" && row.category && row.category !== "Other") card.category = row.category;
        const newEmpty = card.ingredients.length < 3 && !card.steps.length && !(card.sub_recipes ?? []).length;
        const oldHad = (row.ingredients ?? []).length >= 3 || (row.steps ?? []).length > 0 || (row.sub_recipes ?? []).length > 0;
        if (newEmpty && oldHad) {
          card.ingredients = row.ingredients ?? [];
          card.steps = row.steps ?? [];
          card.sub_recipes = row.sub_recipes ?? [];
          card.has_full_recipe = row.has_full_recipe ?? false;
        }
        const newSrc = sourceUrl ?? ((newEmpty && oldHad) ? (row.source_url ?? null) : null);
        const patch = {
          title: card.title,
          caption: meta.caption,
          author: meta.author,
          category: card.category,
          cuisine: card.cuisine,
          ingredients: card.ingredients,
          steps: card.steps,
          tags: card.tags,
          has_full_recipe: card.has_full_recipe,
          sub_recipes: card.sub_recipes ?? [],
          source_url: newSrc,
          thumb_url: row.thumb_url ?? await storeThumb(parsed.shortcode, meta.thumb),
        };
        const pr = await fetch(`${REST}?id=eq.${row.id}`, {
          method: "PATCH",
          headers: { ...dbHeaders, prefer: "return=representation" },
          body: JSON.stringify(patch),
        });
        if (!pr.ok) throw new Error(`db patch ${pr.status}: ${await pr.text()}`);
        const updated = (await pr.json())[0];
        return json({ ...updated, status: "reprocessed", message: `Updated: ${updated.title} → ${updated.category}` });
      }

      const idMatch = sub.match(/^\/api\/recipes\/([0-9a-f-]{36})$/);
      if (idMatch && req.method === "PATCH") {
        const body = await req.json().catch(() => ({}));
        const allowed = ["title", "category", "cuisine", "favorite", "ingredients", "steps", "tags", "rating", "notes"];
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
