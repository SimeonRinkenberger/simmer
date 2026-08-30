// The Simmer web app — one self-contained HTML page served by index.ts.
// Wrapped in String.raw; do not use backticks or "${" inside the page source.
export const PAGE_HTML = String.raw`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">
<title>Simmer</title>
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Simmer">
<link rel="apple-touch-icon" href="icon.png">
<link rel="icon" href="icon.png">
<!-- No web-app manifest on purpose: iOS would use its start_url and drop the ?key= from the installed app's launch URL. -->
<style>
  :root {
    --bg: #FAF6F1; --card: #FFFFFF; --text: #2B2320; --muted: #8A7E74;
    --accent: #E1572F; --accent-soft: #FBE9E2; --line: #EFE7DE;
    --shadow: 0 2px 12px rgba(60,40,20,.07);
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #171310; --card: #241E19; --text: #F3EDE7; --muted: #A79A8E;
      --accent: #FF7A50; --accent-soft: #3A2A22; --line: #322A24;
      --shadow: 0 2px 12px rgba(0,0,0,.35);
    }
  }
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  html, body { margin: 0; padding: 0; background: var(--bg); color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif;
    overscroll-behavior-y: none; }
  body { padding-bottom: calc(24px + env(safe-area-inset-bottom)); }

  header { position: sticky; top: 0; z-index: 20; background: color-mix(in srgb, var(--bg) 82%, transparent);
    -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px);
    padding: calc(10px + env(safe-area-inset-top)) 16px 10px; border-bottom: 1px solid var(--line); }
  .titlerow { display: flex; align-items: center; justify-content: space-between; }
  h1 { font-size: 26px; margin: 0; letter-spacing: -.5px; font-weight: 800; }
  h1 .flame { font-size: 22px; }
  .count { color: var(--muted); font-size: 13px; margin-top: 1px; }
  .addbtn { width: 38px; height: 38px; border-radius: 12px; border: none; background: var(--accent);
    color: #fff; font-size: 24px; line-height: 1; font-weight: 600; box-shadow: var(--shadow); }
  .hbtns { display: flex; gap: 8px; }
  .addbtn.ghost { background: var(--card); color: var(--text); font-size: 19px; }
  .spin { animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .searchwrap { margin-top: 10px; }
  .search { width: 100%; border: none; border-radius: 12px; padding: 10px 14px; font-size: 15px;
    background: var(--card); color: var(--text); box-shadow: var(--shadow); outline: none; }
  .search::placeholder { color: var(--muted); }

  .chips { display: flex; gap: 8px; overflow-x: auto; padding: 12px 16px 4px; scrollbar-width: none; }
  .chips::-webkit-scrollbar { display: none; }
  .chip { flex: 0 0 auto; border: 1px solid var(--line); background: var(--card); color: var(--text);
    border-radius: 999px; padding: 7px 13px; font-size: 13.5px; font-weight: 600; }
  .chip.active { background: var(--accent); border-color: var(--accent); color: #fff; }
  .chip .n { opacity: .6; font-weight: 500; margin-left: 3px; font-size: 12px; }

  .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; padding: 12px 16px; }
  @media (min-width: 640px) { .grid { grid-template-columns: repeat(3, 1fr); } }
  @media (min-width: 980px) { .grid { grid-template-columns: repeat(4, 1fr); } }
  .carditem { background: var(--card); border-radius: 18px; overflow: hidden; box-shadow: var(--shadow);
    display: flex; flex-direction: column; cursor: pointer; }
  .thumbwrap { position: relative; aspect-ratio: 4 / 5; background: linear-gradient(135deg, #E8B08A, #D96A43); }
  .thumbwrap img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .thumbwrap .noimg { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 44px; }
  .fav { position: absolute; top: 8px; right: 8px; font-size: 17px; background: rgba(0,0,0,.35);
    border-radius: 999px; padding: 4px 7px; color: #fff; }
  .catpill { position: absolute; left: 8px; bottom: 8px; background: rgba(0,0,0,.55); color: #fff;
    font-size: 11px; font-weight: 700; padding: 4px 9px; border-radius: 999px; letter-spacing: .2px; }
  .cardbody { padding: 10px 12px 12px; }
  .cardtitle { font-size: 14.5px; font-weight: 700; line-height: 1.25; display: -webkit-box;
    -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .cardmeta { color: var(--muted); font-size: 12px; margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .empty { text-align: center; padding: 60px 30px; color: var(--muted); }
  .empty .big { font-size: 56px; }
  .empty h2 { color: var(--text); font-size: 19px; margin: 12px 0 6px; }
  .empty p { font-size: 14px; line-height: 1.5; margin: 4px 0; }

  .overlay { position: fixed; inset: 0; z-index: 50; background: var(--bg); display: none;
    overflow-y: auto; -webkit-overflow-scrolling: touch; }
  .overlay.open { display: block; animation: slideup .22s ease-out; }
  @keyframes slideup { from { transform: translateY(30px); opacity: .4; } to { transform: none; opacity: 1; } }
  .dtop { position: sticky; top: 0; z-index: 5; display: flex; align-items: center; justify-content: space-between;
    padding: calc(10px + env(safe-area-inset-top)) 12px 10px;
    background: color-mix(in srgb, var(--bg) 82%, transparent);
    -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px); border-bottom: 1px solid var(--line); }
  .iconbtn { border: none; background: var(--card); color: var(--text); box-shadow: var(--shadow);
    width: 36px; height: 36px; border-radius: 12px; font-size: 16px; }
  .dactions { display: flex; gap: 8px; }
  .dcontent { padding: 16px 16px 60px; max-width: 720px; margin: 0 auto; }
  .videowrap { border-radius: 18px; overflow: hidden; background: #000; box-shadow: var(--shadow);
    aspect-ratio: 9 / 14; max-height: 62vh; margin: 0 auto; }
  .videowrap iframe { width: 100%; height: 100%; border: 0; display: block; }
  .dtitlerow { display: flex; align-items: flex-start; gap: 8px; margin-top: 16px; }
  .dtitle { font-size: 22px; font-weight: 800; letter-spacing: -.4px; line-height: 1.2; margin: 0; flex: 1; }
  .editbtn { border: none; background: none; color: var(--muted); font-size: 15px; padding: 4px; }
  .metarow { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; align-items: center; }
  .mchip { background: var(--card); border: 1px solid var(--line); border-radius: 999px;
    padding: 7px 12px; font-size: 13px; font-weight: 600; color: var(--text); }
  .mchip.link { color: var(--accent); text-decoration: none; }
  select.mchip { -webkit-appearance: none; appearance: none; }
  .section { margin-top: 22px; }
  .section h3 { font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: var(--muted); margin: 0 0 10px; }
  .ing { display: flex; align-items: flex-start; gap: 10px; padding: 9px 0; border-bottom: 1px solid var(--line); font-size: 15px; }
  .ing:last-child { border-bottom: none; }
  .ing input { width: 18px; height: 18px; accent-color: var(--accent); margin-top: 1px; }
  .ing.done label { text-decoration: line-through; color: var(--muted); }
  .steps { padding-left: 0; margin: 0; counter-reset: st; list-style: none; }
  .steps li { counter-increment: st; display: flex; gap: 12px; padding: 8px 0; font-size: 15px; line-height: 1.5; }
  .steps li::before { content: counter(st); flex: 0 0 26px; height: 26px; border-radius: 999px;
    background: var(--accent-soft); color: var(--accent); font-weight: 800; font-size: 13px;
    display: flex; align-items: center; justify-content: center; }
  .capbox { background: var(--card); border-radius: 14px; padding: 12px 14px; font-size: 14px;
    line-height: 1.55; color: var(--muted); white-space: pre-wrap; word-break: break-word; }
  details summary { font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: var(--muted);
    margin-bottom: 10px; cursor: pointer; list-style: none; }
  details summary::before { content: "▸ "; }
  details[open] summary::before { content: "▾ "; }
  .norecipe { background: var(--accent-soft); color: var(--text); border-radius: 14px; padding: 12px 14px; font-size: 14px; line-height: 1.5; }

  .sheet { position: fixed; inset: 0; z-index: 60; background: rgba(0,0,0,.45); display: none;
    align-items: flex-end; }
  .sheet.open { display: flex; }
  .sheetbody { background: var(--bg); border-radius: 22px 22px 0 0; width: 100%; padding: 20px 18px calc(24px + env(safe-area-inset-bottom)); }
  .sheetbody h2 { margin: 0 0 4px; font-size: 19px; }
  .sheetbody p { margin: 0 0 14px; color: var(--muted); font-size: 13.5px; }
  .urlinput { width: 100%; border: 1px solid var(--line); border-radius: 12px; padding: 12px 14px;
    font-size: 15px; background: var(--card); color: var(--text); outline: none; }
  .primary { width: 100%; margin-top: 12px; border: none; border-radius: 12px; padding: 14px;
    background: var(--accent); color: #fff; font-size: 16px; font-weight: 700; }
  .primary:disabled { opacity: .6; }

  .toast { position: fixed; left: 50%; bottom: calc(28px + env(safe-area-inset-bottom)); transform: translateX(-50%) translateY(20px);
    background: var(--text); color: var(--bg); padding: 11px 18px; border-radius: 999px; font-size: 14px;
    font-weight: 600; opacity: 0; transition: all .25s; z-index: 100; max-width: 86vw; text-align: center; pointer-events: none; }
  .toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

  .hint { margin: 10px 16px 0; background: var(--accent-soft); border-radius: 14px; padding: 12px 14px;
    font-size: 13.5px; line-height: 1.45; display: none; }
  .hint.show { display: block; }
  .hint b { color: var(--accent); }
  .hint .x { float: right; border: none; background: none; color: var(--muted); font-size: 15px; }
</style>
</head>
<body>
<header>
  <div class="titlerow">
    <div>
      <h1><span class="flame">🍲</span> Simmer</h1>
      <div class="count" id="count"></div>
    </div>
    <div class="hbtns">
      <button class="addbtn ghost" id="refbtn" aria-label="Refresh">↻</button>
      <button class="addbtn" id="addbtn" aria-label="Add by link">+</button>
    </div>
  </div>
  <div class="searchwrap"><input class="search" id="search" type="search" placeholder="Search recipes…"></div>
</header>

<div class="hint" id="hint">
  <button class="x" id="hintx">✕</button>
  Make it an app: tap <b>Share</b> in Safari, then <b>Add to Home Screen</b>.
</div>

<div class="chips" id="chips"></div>
<div class="grid" id="grid"></div>
<div class="empty" id="empty" style="display:none">
  <div class="big">🍳</div>
  <h2>Nothing saved yet</h2>
  <p>In Instagram: tap <b>Share</b> on a recipe video →<br><b>Save Recipe</b> shortcut.</p>
  <p>Or tap <b>+</b> above and paste a link.</p>
</div>

<div class="overlay" id="detail"></div>

<div class="sheet" id="addsheet">
  <div class="sheetbody">
    <h2>Add a recipe</h2>
    <p>Paste an Instagram or TikTok link.</p>
    <input class="urlinput" id="urlinput" type="url" placeholder="https://www.instagram.com/reel/…" autocapitalize="off" autocorrect="off">
    <button class="primary" id="savebtn">Save recipe</button>
  </div>
</div>

<div class="sheet" id="keysheet">
  <div class="sheetbody">
    <h2>Connect your app</h2>
    <p>One-time setup: paste your Simmer link (or just the key part after ?key=).</p>
    <input class="urlinput" id="keyinput" type="text" placeholder="https://…?key=… or the key itself" autocapitalize="off" autocorrect="off">
    <button class="primary" id="keysave">Connect</button>
  </div>
</div>

<div class="toast" id="toast"></div>

<script>
(function () {
  var CATS = ["Breakfast","Lunch","Dinner","Dessert","Snack","Drink","Sauce & Dip","Baking","Other"];
  var params = new URLSearchParams(location.search);
  var KEY = params.get("key") || localStorage.getItem("simmer_key") || "";
  if (params.get("key")) localStorage.setItem("simmer_key", params.get("key"));

  var state = { recipes: [], cat: "All", q: "" };
  var $ = function (id) { return document.getElementById(id); };

  var API_BASE = "https://mfxaogzzegwkscamarre.supabase.co/functions/v1/simmer/api/";

  function api(path, opts) {
    opts = opts || {};
    opts.headers = Object.assign({ "x-app-key": KEY, "content-type": "application/json" }, opts.headers || {});
    return fetch(API_BASE + path, opts).then(function (r) {
      if (r.status === 401) { toast("Bad app key — reopen from your saved link"); throw new Error("401"); }
      return r.json();
    });
  }

  function toast(msg) {
    var t = $("toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove("show"); }, 2600);
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  // ---------- list ----------
  function visible() {
    var q = state.q.toLowerCase();
    return state.recipes.filter(function (r) {
      if (state.cat === "★") { if (!r.favorite) return false; }
      else if (state.cat !== "All" && r.category !== state.cat) return false;
      if (!q) return true;
      var hay = [r.title, r.caption, r.cuisine, r.author, (r.tags || []).join(" ")].join(" ").toLowerCase();
      return hay.indexOf(q) >= 0;
    });
  }

  function renderChips() {
    var box = $("chips"); box.innerHTML = "";
    var counts = {};
    state.recipes.forEach(function (r) { counts[r.category] = (counts[r.category] || 0) + 1; });
    var favs = state.recipes.filter(function (r) { return r.favorite; }).length;
    var items = [["All", state.recipes.length]];
    if (favs) items.push(["★", favs]);
    CATS.forEach(function (c) { if (counts[c]) items.push([c, counts[c]]); });
    items.forEach(function (it) {
      var b = el("button", "chip" + (state.cat === it[0] ? " active" : ""), it[0] === "★" ? "★ Favorites" : it[0]);
      var n = el("span", "n", String(it[1])); b.appendChild(n);
      b.onclick = function () { state.cat = it[0]; render(); };
      box.appendChild(b);
    });
  }

  function renderGrid() {
    var grid = $("grid"); grid.innerHTML = "";
    var rows = visible();
    $("empty").style.display = state.recipes.length ? "none" : "block";
    $("count").textContent = state.recipes.length
      ? state.recipes.length + " recipe" + (state.recipes.length === 1 ? "" : "s") + " saved" : "your recipe library";
    rows.forEach(function (r) {
      var card = el("div", "carditem");
      var tw = el("div", "thumbwrap");
      if (r.thumb_url) {
        var img = document.createElement("img");
        img.loading = "lazy"; img.src = r.thumb_url; img.alt = "";
        img.onerror = function () { img.remove(); tw.appendChild(el("div", "noimg", "🍽️")); };
        tw.appendChild(img);
      } else tw.appendChild(el("div", "noimg", "🍽️"));
      if (r.favorite) tw.appendChild(el("div", "fav", "★"));
      tw.appendChild(el("div", "catpill", r.category));
      card.appendChild(tw);
      var body = el("div", "cardbody");
      body.appendChild(el("div", "cardtitle", r.title || "Untitled"));
      var meta = [r.cuisine, r.author ? "@" + String(r.author).replace(/^@/, "") : null]
        .filter(Boolean).join(" · ");
      if (meta) body.appendChild(el("div", "cardmeta", meta));
      card.appendChild(body);
      card.onclick = function () { openDetail(r); };
      grid.appendChild(card);
    });
  }

  function render() { renderChips(); renderGrid(); }

  function load() {
    return api("recipes").then(function (rows) {
      if (Array.isArray(rows)) { state.recipes = rows; render(); }
      else toast(rows.message || "Could not load");
    }).catch(function () {});
  }

  // ---------- detail ----------
  function embedSrc(r) {
    if (r.platform === "tiktok") return "https://www.tiktok.com/embed/v2/" + String(r.shortcode).replace(/^tt-/, "");
    return r.url.replace(/\/+$/, "") + "/embed/";
  }

  function openDetail(r) {
    var ov = $("detail"); ov.innerHTML = "";

    var top = el("div", "dtop");
    var back = el("button", "iconbtn", "←"); back.onclick = closeDetail;
    var actions = el("div", "dactions");
    var re = el("button", "iconbtn", "↻");
    re.title = "Re-extract this recipe";
    re.onclick = function () {
      re.classList.add("spin"); toast("Re-extracting… takes ~20 seconds");
      api("recipes/" + r.id + "/reprocess", { method: "POST" }).then(function (res) {
        re.classList.remove("spin");
        if (res && res.id) { toast(res.message || "Updated"); load(); openDetail(res); }
        else toast((res && res.message) || "Could not update");
      }).catch(function () { re.classList.remove("spin"); toast("Network error"); });
    };
    var fav = el("button", "iconbtn", r.favorite ? "★" : "☆");
    fav.style.color = r.favorite ? "#E7A33B" : "";
    fav.onclick = function () {
      r.favorite = !r.favorite;
      fav.textContent = r.favorite ? "★" : "☆"; fav.style.color = r.favorite ? "#E7A33B" : "";
      api("recipes/" + r.id, { method: "PATCH", body: JSON.stringify({ favorite: r.favorite }) }).then(load);
    };
    var del = el("button", "iconbtn", "🗑");
    del.onclick = function () {
      if (!confirm("Delete “" + (r.title || "this recipe") + "”?")) return;
      api("recipes/" + r.id, { method: "DELETE" }).then(function () { closeDetail(); toast("Deleted"); load(); });
    };
    actions.appendChild(re); actions.appendChild(fav); actions.appendChild(del);
    top.appendChild(back); top.appendChild(actions);
    ov.appendChild(top);

    var c = el("div", "dcontent");

    var vw = el("div", "videowrap");
    var ifr = document.createElement("iframe");
    ifr.src = embedSrc(r);
    ifr.setAttribute("allowfullscreen", "");
    ifr.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture");
    ifr.setAttribute("scrolling", "no");
    vw.appendChild(ifr);
    c.appendChild(vw);

    var tr = el("div", "dtitlerow");
    var h = el("h2", "dtitle", r.title || "Untitled");
    var ed = el("button", "editbtn", "✏️");
    ed.onclick = function () {
      var t = prompt("Recipe name", r.title || "");
      if (t && t.trim()) {
        r.title = t.trim(); h.textContent = r.title;
        api("recipes/" + r.id, { method: "PATCH", body: JSON.stringify({ title: r.title }) }).then(load);
      }
    };
    tr.appendChild(h); tr.appendChild(ed);
    c.appendChild(tr);

    var mr = el("div", "metarow");
    var sel = document.createElement("select"); sel.className = "mchip";
    CATS.forEach(function (cat) {
      var o = document.createElement("option"); o.value = cat; o.textContent = cat;
      if (cat === r.category) o.selected = true;
      sel.appendChild(o);
    });
    sel.onchange = function () {
      r.category = sel.value;
      api("recipes/" + r.id, { method: "PATCH", body: JSON.stringify({ category: r.category }) })
        .then(function () { toast("Moved to " + r.category); load(); });
    };
    mr.appendChild(sel);
    if (r.cuisine) mr.appendChild(el("span", "mchip", r.cuisine));
    if (r.source_url) {
      var src = document.createElement("a");
      src.className = "mchip link"; src.href = r.source_url; src.target = "_blank"; src.rel = "noopener";
      var host = "recipe source";
      try { host = new URL(r.source_url).hostname.replace(/^www\./, ""); } catch (err) {}
      src.textContent = "Recipe: " + host + " ↗";
      mr.appendChild(src);
    }
    var link = document.createElement("a");
    link.className = "mchip link"; link.href = r.url; link.target = "_blank"; link.rel = "noopener";
    link.textContent = (r.platform === "tiktok" ? "Open in TikTok" : "Open in Instagram") + " ↗";
    mr.appendChild(link);
    c.appendChild(mr);

    var ings = Array.isArray(r.ingredients) ? r.ingredients : [];
    var steps = Array.isArray(r.steps) ? r.steps : [];

    if (ings.length) {
      var s1 = el("div", "section");
      s1.appendChild(el("h3", null, "Ingredients"));
      ings.forEach(function (it, i) {
        var row = el("div", "ing");
        var cb = document.createElement("input"); cb.type = "checkbox"; cb.id = "ing" + i;
        var lb = document.createElement("label"); lb.htmlFor = cb.id; lb.textContent = it; lb.style.flex = "1";
        cb.onchange = function () { row.classList.toggle("done", cb.checked); };
        row.appendChild(cb); row.appendChild(lb);
        s1.appendChild(row);
      });
      c.appendChild(s1);
    }
    if (steps.length) {
      var s2 = el("div", "section");
      s2.appendChild(el("h3", null, "Steps"));
      var ol = el("ol", "steps");
      steps.forEach(function (st) { var li = el("li"); li.appendChild(el("span", null, st)); ol.appendChild(li); });
      s2.appendChild(ol);
      c.appendChild(s2);
    }
    if (!ings.length && !steps.length) {
      var nb = el("div", "section");
      nb.appendChild(el("div", "norecipe",
        "No written recipe in this video's caption — watch the video above, or open it on " +
        (r.platform === "tiktok" ? "TikTok" : "Instagram") + " for details."));
      c.appendChild(nb);
    }

    if (r.caption) {
      var s3 = el("div", "section");
      var d = document.createElement("details");
      var sm = document.createElement("summary"); sm.textContent = "Original caption";
      d.appendChild(sm);
      d.appendChild(el("div", "capbox", r.caption));
      s3.appendChild(d);
      c.appendChild(s3);
    }

    ov.appendChild(c);
    var wasOpen = ov.classList.contains("open");
    ov.classList.add("open");
    document.body.style.overflow = "hidden";
    if (!wasOpen) history.pushState({ detail: 1 }, "");
  }

  function closeDetail() {
    var ov = $("detail");
    ov.classList.remove("open"); ov.innerHTML = "";
    document.body.style.overflow = "";
    if (history.state && history.state.detail) history.back();
  }
  window.addEventListener("popstate", function () {
    var ov = $("detail");
    if (ov.classList.contains("open")) { ov.classList.remove("open"); ov.innerHTML = ""; document.body.style.overflow = ""; }
  });

  // ---------- add by link ----------
  $("addbtn").onclick = function () {
    $("addsheet").classList.add("open");
    setTimeout(function () { $("urlinput").focus(); }, 50);
  };
  $("addsheet").addEventListener("click", function (e) {
    if (e.target === $("addsheet")) $("addsheet").classList.remove("open");
  });
  $("savebtn").onclick = function () {
    var u = $("urlinput").value.trim();
    if (!u) return;
    var b = $("savebtn"); b.disabled = true; b.textContent = "Saving… (10–20s)";
    api("ingest", { method: "POST", body: JSON.stringify({ url: u }) }).then(function (res) {
      b.disabled = false; b.textContent = "Save recipe";
      toast(res.message || "Done");
      if (res.status === "saved" || res.status === "exists") {
        $("urlinput").value = ""; $("addsheet").classList.remove("open"); load();
      }
    }).catch(function () { b.disabled = false; b.textContent = "Save recipe"; toast("Network error"); });
  };

  // ---------- search ----------
  $("search").addEventListener("input", function (e) { state.q = e.target.value; renderGrid(); });

  // ---------- refresh: manual button + automatic when returning to the app ----------
  $("refbtn").onclick = function () {
    var b = $("refbtn"); b.classList.add("spin");
    Promise.resolve(load()).then(function () { b.classList.remove("spin"); toast("Up to date"); });
  };
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden && KEY) load();
  });
  window.addEventListener("pageshow", function (e) { if (e.persisted && KEY) load(); });

  // ---------- install hint ----------
  var standalone = window.navigator.standalone === true || matchMedia("(display-mode: standalone)").matches;
  if (!standalone && !localStorage.getItem("simmer_hint_done") && /iPhone|iPad/.test(navigator.userAgent)) {
    $("hint").classList.add("show");
  }
  $("hintx").onclick = function () {
    $("hint").classList.remove("show"); localStorage.setItem("simmer_hint_done", "1");
  };

  $("keysave").onclick = function () {
    var v = $("keyinput").value.trim();
    var m = v.match(/key=([0-9a-fA-F]{16,})/) || v.match(/^([0-9a-fA-F]{16,})$/);
    if (!m) { toast("That doesn't look like a key or a Simmer link"); return; }
    KEY = m[1];
    try { localStorage.setItem("simmer_key", KEY); } catch (e) {}
    $("keysheet").classList.remove("open");
    toast("Connected!");
    load();
  };

  if (!KEY) $("keysheet").classList.add("open");
  else load();
})();
</script>
</body>
</html>`;
