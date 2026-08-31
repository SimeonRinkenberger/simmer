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
<meta name="theme-color" content="#FBF7F1" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#17120E" media="(prefers-color-scheme: dark)">
<!-- No web-app manifest on purpose: iOS would use its start_url and drop the ?key= from the installed app's launch URL. -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500..700&family=DM+Sans:opsz,wght@9..40,400..700&display=swap" rel="stylesheet">
<style>
  :root {
    color-scheme: light dark;
    /* surfaces — warm cream canvas, never pure white */
    --paper: #FBF7F1; --card: #FFFDFA; --sand: #F2EADE;
    /* ink — warm near-black, never pure black */
    --ink: #241B15; --ink-2: #6E5D51; --muted: #9C8B7D;
    --line: rgba(36,27,21,.085); --line-2: rgba(36,27,21,.17);
    /* one accent, capped at ~10% of any screen */
    --ember: #C4512C; --ember-ink: #A8401F; --ember-soft: #F8E8DF; --on-ember: #FFF9F5;
    --honey: #C0871F;
    --scrim: rgba(38,24,16,.44);
    --glow: rgba(196,81,44,.28);
    --cook-glow: rgba(196,81,44,.10);
    --sh-sm: 0 1px 2px rgba(58,38,24,.05), 0 2px 6px rgba(58,38,24,.04);
    --sh-md: 0 1px 2px rgba(58,38,24,.04), 0 6px 14px rgba(58,38,24,.06), 0 16px 30px rgba(58,38,24,.045);
    --sh-lg: 0 2px 6px rgba(58,38,24,.06), 0 12px 28px rgba(58,38,24,.10), 0 30px 56px rgba(58,38,24,.07);
    --sh-up: 0 -6px 34px rgba(40,24,14,.17);
    --grain: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='.055'/%3E%3C/svg%3E");
    --serif: "Fraunces", Georgia, "Times New Roman", serif;
    --sans: "DM Sans", -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif;
    --e-out: cubic-bezier(.22,.9,.3,1);
    --e-spring: cubic-bezier(.32,.72,0,1);
    --e-soft: cubic-bezier(.4,0,.2,1);
    --t-1: 150ms; --t-2: 220ms; --t-3: 320ms; --t-4: 420ms;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      /* moody + cozy: warm charcoal with a brown undertone, elevation by lightness */
      --paper: #17120E; --card: #221A15; --sand: #2C221B;
      --ink: #F7EFE6; --ink-2: #C6B5A6; --muted: #96856F;
      --line: rgba(247,239,230,.09); --line-2: rgba(247,239,230,.18);
      --ember: #E07A50; --ember-ink: #F0966B; --ember-soft: #35211A; --on-ember: #1E120C;
      --honey: #E3B25F;
      --scrim: rgba(6,4,2,.64);
      --glow: rgba(224,122,80,.26);
      --cook-glow: rgba(224,122,80,.13);
      --sh-sm: 0 1px 2px rgba(0,0,0,.4), 0 2px 8px rgba(0,0,0,.3);
      --sh-md: 0 2px 6px rgba(0,0,0,.42), 0 10px 24px rgba(0,0,0,.36);
      --sh-lg: 0 4px 12px rgba(0,0,0,.5), 0 20px 46px rgba(0,0,0,.44);
      --sh-up: 0 -8px 40px rgba(0,0,0,.55);
      --grain: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='.10'/%3E%3C/svg%3E");
    }
  }
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  html, body { margin: 0; padding: 0; background-color: var(--paper); color: var(--ink);
    font-family: var(--sans); overscroll-behavior-y: none;
    -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
  body { padding-bottom: calc(78px + env(safe-area-inset-bottom)); background-image: var(--grain); }
  button, input, select, textarea { font-family: var(--sans); }
  button { cursor: pointer; }

  /* ---------- header ---------- */
  header { position: sticky; top: 0; z-index: 20;
    background: color-mix(in srgb, var(--paper) 84%, transparent);
    -webkit-backdrop-filter: blur(20px) saturate(1.5); backdrop-filter: blur(20px) saturate(1.5);
    padding: calc(12px + env(safe-area-inset-top)) 18px 12px; border-bottom: 1px solid var(--line); }
  .titlerow { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; }
  h1 { font-family: var(--serif); font-size: 30px; margin: 0; font-weight: 700;
    letter-spacing: -.025em; line-height: 1; font-variation-settings: "opsz" 110, "wght" 700; }
  .count { color: var(--muted); font-size: 10.5px; margin-top: 7px; font-weight: 700;
    letter-spacing: .15em; text-transform: uppercase; }
  .hbtns { display: flex; gap: 8px; }
  .addbtn { width: 40px; height: 40px; border-radius: 14px; border: none; background: var(--ember);
    color: var(--on-ember); font-size: 23px; line-height: 1; font-weight: 600;
    box-shadow: 0 3px 12px var(--glow); transition: transform var(--t-1) var(--e-out); }
  .addbtn.ghost { background: var(--sand); color: var(--ink-2); font-size: 17px; box-shadow: none; }
  .spin { animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .searchwrap { margin-top: 14px; position: relative; display: block; }
  .searchico { position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
    color: var(--muted); pointer-events: none; display: flex; }
  .search { width: 100%; border: 1px solid var(--line); border-radius: 14px;
    padding: 11px 14px 11px 40px; font-size: 15px; background: var(--sand); color: var(--ink);
    outline: none; transition: border-color var(--t-2), background-color var(--t-2); }
  .search:focus { border-color: var(--ember); background: var(--card); }
  .search::placeholder { color: var(--muted); }

  /* ---------- filter chips ---------- */
  .chips { display: flex; gap: 7px; overflow-x: auto; padding: 14px 18px 6px; scrollbar-width: none;
    -webkit-mask-image: linear-gradient(90deg, #000 0, #000 calc(100% - 26px), transparent 100%);
    mask-image: linear-gradient(90deg, #000 0, #000 calc(100% - 26px), transparent 100%); }
  .chips::-webkit-scrollbar { display: none; }
  .chip { flex: 0 0 auto; border: none; background: var(--sand); color: var(--ink-2);
    border-radius: 999px; padding: 9px 14px; font-size: 13px; font-weight: 600; line-height: 1;
    letter-spacing: -.005em;
    transition: background-color var(--t-2) var(--e-soft), color var(--t-2) var(--e-soft),
      transform var(--t-1) var(--e-out), box-shadow var(--t-2) var(--e-soft); }
  .chip:active { transform: scale(.94); }
  .chip.active { background: var(--ember); color: var(--on-ember); box-shadow: 0 3px 12px var(--glow); }
  .chip .n { opacity: .5; font-weight: 700; margin-left: 5px; font-size: 11px; font-variant-numeric: tabular-nums; }
  .chip.active .n { opacity: .7; }

  /* ---------- recipe grid ---------- */
  .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px 13px; padding: 12px 18px 24px; }
  @media (min-width: 640px) { .grid { grid-template-columns: repeat(3, 1fr); } }
  @media (min-width: 980px) { .grid { grid-template-columns: repeat(4, 1fr); } }
  .carditem { background: none; border: none; display: flex; flex-direction: column; cursor: pointer;
    min-width: 0; transition: transform var(--t-2) var(--e-out); }
  .carditem:active { transform: scale(.968); }
  @keyframes cardin { from { opacity: 0; transform: translateY(14px); } }
  .thumbwrap { position: relative; aspect-ratio: 4 / 5; border-radius: 18px; overflow: hidden;
    background: var(--sand); box-shadow: var(--sh-md); isolation: isolate; }
  .thumbwrap img { width: 100%; height: 100%; object-fit: cover; display: block;
    opacity: 0; transform: scale(1.05);
    transition: opacity 400ms var(--e-soft), transform 700ms var(--e-out); }
  .thumbwrap.loaded img { opacity: 1; transform: none; }
  /* Finite sweep on purpose: lazy images far below the fold stay pending indefinitely,
     and an infinite animation per card would keep the compositor busy the whole session. */
  .thumbwrap.loading::after { content: ""; position: absolute; inset: 0; pointer-events: none;
    background: linear-gradient(100deg, transparent 25%, rgba(255,255,255,.38) 50%, transparent 75%);
    transform: translateX(-100%); animation: shimmer 1.4s var(--e-soft) 3; }
  @keyframes shimmer { to { transform: translateX(100%); } }
  .thumbwrap .noimg { position: absolute; inset: 0; display: flex; align-items: center;
    justify-content: center; font-size: 40px; opacity: .5; }
  .thumbwrap::before { content: ""; position: absolute; inset: 0; pointer-events: none; z-index: 1;
    box-shadow: inset 0 0 0 1px var(--line); border-radius: inherit; }
  .fav { position: absolute; top: 9px; right: 9px; z-index: 2; width: 27px; height: 27px;
    display: flex; align-items: center; justify-content: center; font-size: 13px; line-height: 1;
    background: rgba(26,16,10,.42); border-radius: 999px; color: #FFD9A0; }
  .cardbody { padding: 11px 3px 0; min-width: 0; }
  .cardkick { display: flex; align-items: baseline; justify-content: space-between; gap: 8px;
    margin-bottom: 5px; min-width: 0; }
  .catpill { font-size: 9.5px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase;
    color: var(--ember-ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
  .ratepill { font-size: 10.5px; font-weight: 700; color: var(--honey); white-space: nowrap;
    flex: 0 0 auto; letter-spacing: .02em; }
  .cardtitle { font-family: var(--serif); font-size: 15.5px; font-weight: 600; line-height: 1.24;
    letter-spacing: -.014em; color: var(--ink); display: -webkit-box;
    -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .cardmeta { color: var(--muted); font-size: 11.5px; margin-top: 5px; font-weight: 500;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  /* ---------- empty states ---------- */
  .empty, .gempty { text-align: center; padding: 54px 32px 40px; color: var(--ink-2); }
  .empty .big, .gempty .big { position: relative; width: 96px; height: 96px; margin: 0 auto 22px;
    border-radius: 999px; background: radial-gradient(circle at 50% 36%, var(--card), var(--sand));
    box-shadow: var(--sh-md); display: flex; align-items: center; justify-content: center;
    font-size: 40px; animation: floaty 5.5s ease-in-out infinite; }
  .empty .big::after, .gempty .big::after { content: ""; position: absolute; inset: -11px;
    border-radius: 999px; border: 1px dashed var(--line-2); }
  @keyframes floaty { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
  .empty h2, .gempty h2 { color: var(--ink); font-family: var(--serif); font-size: 22px; font-weight: 600;
    margin: 0 0 10px; letter-spacing: -.02em; }
  .empty p, .gempty p { font-size: 13.5px; line-height: 1.65; margin: 5px auto; max-width: 290px; }
  .empty b, .gempty b { color: var(--ember-ink); font-weight: 700; }

  /* ---------- recipe detail ---------- */
  .overlay { position: fixed; inset: 0; z-index: 50; background-color: var(--paper);
    background-image: var(--grain); display: none; overflow-y: auto; -webkit-overflow-scrolling: touch; }
  .overlay.open { display: block; animation: slideup .34s var(--e-out); }
  @keyframes slideup { from { transform: translateY(24px); opacity: 0; } to { transform: none; opacity: 1; } }
  .dtop { position: sticky; top: 0; z-index: 5; display: flex; align-items: center; justify-content: space-between;
    padding: calc(10px + env(safe-area-inset-top)) 14px 10px;
    background: color-mix(in srgb, var(--paper) 82%, transparent);
    -webkit-backdrop-filter: blur(20px) saturate(1.5); backdrop-filter: blur(20px) saturate(1.5);
    border-bottom: 1px solid var(--line); }
  .iconbtn { border: none; background: var(--sand); color: var(--ink-2);
    width: 38px; height: 38px; border-radius: 13px; font-size: 16px; line-height: 1;
    display: inline-flex; align-items: center; justify-content: center;
    transition: transform var(--t-1) var(--e-out), background-color var(--t-2), color var(--t-2); }
  .iconbtn:active, .addbtn:active, .whybtn:active, .cartbtn:active { transform: scale(.88); }
  .dactions { display: flex; gap: 7px; }
  .dcontent { padding: 18px 18px 76px; max-width: 720px; margin: 0 auto; }
  .videowrap { border-radius: 22px; overflow: hidden; background: #000; box-shadow: var(--sh-lg);
    aspect-ratio: 9 / 14; max-height: 60vh; margin: 0 auto; }
  .videowrap.wide { aspect-ratio: 16 / 9; max-height: 40vh; }
  .videowrap iframe { width: 100%; height: 100%; border: 0; display: block; }
  .webimgwrap { border-radius: 22px; overflow: hidden; box-shadow: var(--sh-lg); max-height: 46vh; }
  .webimgwrap img { width: 100%; max-height: 46vh; object-fit: cover; display: block; }
  .dtitlerow { display: flex; align-items: flex-start; gap: 10px; margin-top: 22px; }
  .dtitle { font-family: var(--serif); font-size: 30px; font-weight: 700; letter-spacing: -.028em;
    line-height: 1.1; margin: 0; flex: 1; font-variation-settings: "opsz" 110, "wght" 700; }
  .editbtn { border: none; background: none; color: var(--muted); font-size: 14px; padding: 6px 2px;
    transition: transform var(--t-1) var(--e-out); }
  .editbtn:active { transform: scale(.86); }
  .metarow { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 14px; align-items: center; }
  .mchip { background: var(--sand); border: none; border-radius: 999px; padding: 7px 13px;
    font-size: 12.5px; font-weight: 600; color: var(--ink-2); line-height: 1.2; }
  .mchip.link { color: var(--ember-ink); background: var(--ember-soft); text-decoration: none; }
  select.mchip { -webkit-appearance: none; appearance: none; padding-right: 26px;
    background-image: linear-gradient(45deg, transparent 50%, var(--muted) 50%),
      linear-gradient(135deg, var(--muted) 50%, transparent 50%);
    background-position: calc(100% - 14px) 50%, calc(100% - 9px) 50%;
    background-size: 5px 5px, 5px 5px; background-repeat: no-repeat; }

  /* nutrition: an editorial spec strip, not pills */
  .nutrow { display: flex; margin-top: 16px; background: var(--card); border: 1px solid var(--line);
    border-radius: 18px; overflow: hidden; box-shadow: var(--sh-sm); }
  .nutchip { flex: 1; min-width: 0; padding: 11px 5px; text-align: center; border-right: 1px solid var(--line); }
  .nutchip:last-child { border-right: none; }
  .nutval { display: block; font-family: var(--serif); font-size: 17px; font-weight: 700;
    color: var(--ink); letter-spacing: -.02em; line-height: 1.1; }
  .nutlab { display: block; font-size: 8.5px; font-weight: 700; letter-spacing: .14em;
    text-transform: uppercase; color: var(--muted); margin-top: 4px; }
  .nutlabel { display: block; color: var(--muted); font-size: 11px; margin-top: 8px; text-align: center; }

  /* serving scaler */
  .scalerow { display: flex; align-items: center; gap: 7px; margin-top: 20px; flex-wrap: wrap; }
  .scalelbl { width: 100%; font-size: 10.5px; text-transform: uppercase; letter-spacing: .16em;
    color: var(--muted); font-weight: 700; margin-bottom: 3px; }
  .scalechip { border: 1px solid var(--line-2); background: transparent; color: var(--ink-2);
    border-radius: 999px; padding: 7px 14px; font-size: 13px; font-weight: 700; line-height: 1;
    transition: background-color var(--t-2) var(--e-soft), color var(--t-2) var(--e-soft),
      border-color var(--t-2), transform var(--t-1) var(--e-out); }
  .scalechip:active { transform: scale(.92); }
  .scalechip.active { background: var(--ink); border-color: var(--ink); color: var(--paper); }

  /* sections as modular cards */
  .section { margin-top: 16px; background: var(--card); border: 1px solid var(--line);
    border-radius: 22px; padding: 18px 16px; box-shadow: var(--sh-sm); }
  .section h3 { font-size: 10.5px; text-transform: uppercase; letter-spacing: .17em;
    color: var(--muted); margin: 0; font-weight: 700; }
  .sechead { display: flex; align-items: center; justify-content: space-between; margin: 0 0 12px; gap: 10px; }
  .addall { border: none; background: var(--ember-soft); color: var(--ember-ink); border-radius: 999px;
    padding: 7px 13px; font-size: 11.5px; font-weight: 700; line-height: 1;
    transition: transform var(--t-1) var(--e-out); }
  .addall:active { transform: scale(.94); }
  .subhead { font-family: var(--serif); font-size: 21px; font-weight: 700; margin: 30px 0 0;
    letter-spacing: -.022em; display: flex; align-items: center; gap: 12px; }
  .subhead::after { content: ""; flex: 1; height: 1px; background: var(--line-2); }

  .ing { display: flex; align-items: flex-start; gap: 9px; padding: 11px 0;
    border-bottom: 1px solid var(--line); font-size: 15px; }
  .ing:last-child { border-bottom: none; padding-bottom: 0; }
  .ing input { -webkit-appearance: none; appearance: none; width: 22px; height: 22px; flex: 0 0 22px;
    border-radius: 999px; border: 1.5px solid var(--line-2); background: transparent; margin: 1px 0 0;
    position: relative; display: block;
    transition: background-color var(--t-1), border-color var(--t-1), transform var(--t-1) var(--e-out); }
  .ing input:checked { background: var(--ember); border-color: var(--ember); }
  .ing input:checked::after { content: "✓"; position: absolute; inset: 0; display: flex;
    align-items: center; justify-content: center; color: var(--on-ember); font-size: 13px; font-weight: 800; }
  .ing input:active { transform: scale(.86); }
  .ing label { line-height: 1.45; padding-top: 1px; color: var(--ink-2); }
  .qty { font-weight: 700; color: var(--ink); }
  .ing.done label { text-decoration: line-through; color: var(--muted); }
  .ing.done .qty { color: var(--muted); }
  .cartbtn { border: none; background: var(--sand); color: var(--ink-2); border-radius: 999px;
    width: 29px; height: 29px; font-size: 15px; font-weight: 700; flex: 0 0 29px; line-height: 1;
    display: inline-flex; align-items: center; justify-content: center;
    transition: transform var(--t-1) var(--e-out), background-color var(--t-2), color var(--t-2); }
  .cartbtn:not(.convbtn) { background: var(--ember-soft); color: var(--ember-ink); font-size: 17px; }
  .cartbtn:disabled { opacity: .45; }

  .steps { padding-left: 0; margin: 0; counter-reset: st; list-style: none; }
  .steps li { counter-increment: st; display: flex; gap: 14px; padding: 13px 0; font-size: 15px;
    line-height: 1.62; border-bottom: 1px solid var(--line); align-items: flex-start; }
  .steps li:last-child { border-bottom: none; padding-bottom: 0; }
  .steps li::before { content: counter(st); flex: 0 0 auto; min-width: 24px;
    font-family: var(--serif); font-size: 24px; font-weight: 600; font-style: italic;
    color: var(--ember); line-height: 1.05; letter-spacing: -.02em; }
  .steps li .steptext { flex: 1; }
  .whybtn { flex: 0 0 24px; width: 24px; height: 24px; border-radius: 999px; border: none;
    background: var(--sand); color: var(--muted); font-size: 12px; font-weight: 800;
    line-height: 1; margin-top: 3px; transition: transform var(--t-1) var(--e-out),
      background-color var(--t-2), color var(--t-2); }
  .whybtn:active { background: var(--ember-soft); color: var(--ember-ink); }

  .expstep { font-family: var(--serif); font-style: italic; color: var(--ink-2); font-size: 15px;
    margin-bottom: 14px; border-left: 2px solid var(--ember); padding-left: 12px; line-height: 1.45; }
  .expbody { font-size: 15px; line-height: 1.65; min-height: 48px; white-space: pre-wrap; color: var(--ink); }
  .capbox { background: var(--sand); border-radius: 16px; padding: 13px 15px; font-size: 13.5px;
    line-height: 1.6; color: var(--ink-2); white-space: pre-wrap; word-break: break-word; }
  details summary { font-size: 10.5px; text-transform: uppercase; letter-spacing: .16em; color: var(--muted);
    margin-bottom: 10px; cursor: pointer; list-style: none; font-weight: 700; }
  details summary::-webkit-details-marker { display: none; }
  details summary::before { content: "▸ "; }
  details[open] summary::before { content: "▾ "; }
  .norecipe { background: var(--ember-soft); color: var(--ink); border-radius: 16px; padding: 13px 15px;
    font-size: 13.5px; line-height: 1.55; }

  .stars { display: flex; gap: 5px; margin: 12px 0 14px; }
  .star { border: none; background: none; font-size: 29px; line-height: 1; color: var(--line-2);
    padding: 2px 3px; transition: color var(--t-1); }
  .star.on { color: var(--honey); }
  .notesbox { width: 100%; min-height: 92px; border: 1px solid var(--line); border-radius: 16px;
    background: var(--sand); color: var(--ink); padding: 13px 15px; font-size: 15px;
    line-height: 1.55; resize: vertical; outline: none;
    transition: border-color var(--t-2), background-color var(--t-2); }
  .notesbox:focus { border-color: var(--ember); background: var(--card); }
  .notesbox::placeholder { color: var(--muted); }

  /* ---------- pull to refresh ---------- */
  #ptr { position: fixed; top: calc(env(safe-area-inset-top) + 10px); left: 50%; margin-left: -19px;
    width: 38px; height: 38px; border-radius: 999px; background: var(--card); box-shadow: var(--sh-md);
    border: 1px solid var(--line); display: flex; align-items: center; justify-content: center;
    z-index: 45; transform: translateY(-70px); transition: transform var(--t-3) var(--e-out); }
  #ptrspin { display: block; font-weight: 800; color: var(--ember); font-size: 16px; }

  /* ---------- sheets ---------- */
  .sheet { position: fixed; inset: 0; z-index: 60; background: var(--scrim); display: flex;
    align-items: flex-end; opacity: 0; pointer-events: none; transition: opacity var(--t-3) var(--e-soft); }
  .sheet.open { opacity: 1; pointer-events: auto; }
  .sheetbody { background-color: var(--paper); background-image: var(--grain);
    border-radius: 30px 30px 0 0; width: 100%; max-height: 90vh; overflow-y: auto;
    border-top: 1px solid var(--line-2);
    padding: 12px 20px calc(26px + env(safe-area-inset-bottom));
    transform: translateY(100%); transition: transform var(--t-4) var(--e-spring); box-shadow: var(--sh-up); }
  .sheet.open .sheetbody { transform: none; }
  .sheetbody::before { content: ""; display: block; width: 38px; height: 4px; border-radius: 999px;
    background: var(--line-2); margin: 0 auto 18px; }
  .sheetbody h2 { margin: 0 0 6px; font-family: var(--serif); font-size: 23px; font-weight: 700;
    letter-spacing: -.024em; }
  .sheetbody p { margin: 0 0 16px; color: var(--ink-2); font-size: 13.5px; line-height: 1.55; }
  .urlinput { width: 100%; border: 1px solid var(--line); border-radius: 14px; padding: 13px 15px;
    font-size: 15px; background: var(--card); color: var(--ink); outline: none;
    transition: border-color var(--t-2); }
  .urlinput:focus { border-color: var(--ember); }
  .urlinput::placeholder { color: var(--muted); }
  .primary { width: 100%; margin-top: 14px; border: none; border-radius: 16px; padding: 15px;
    background: var(--ember); color: var(--on-ember); font-size: 15.5px; font-weight: 700;
    box-shadow: 0 4px 16px var(--glow); transition: transform var(--t-1) var(--e-out), box-shadow var(--t-2); }
  .primary:active { transform: scale(.985); }
  .primary:disabled { opacity: .55; box-shadow: none; }

  /* ---------- toast ---------- */
  .toast { position: fixed; left: 50%; bottom: calc(96px + env(safe-area-inset-bottom));
    transform: translateX(-50%) translateY(14px) scale(.96);
    background: var(--ink); color: var(--paper); padding: 12px 20px; border-radius: 999px;
    font-size: 13.5px; font-weight: 600; opacity: 0; box-shadow: var(--sh-lg);
    transition: opacity var(--t-2) var(--e-soft), transform var(--t-3) var(--e-out);
    z-index: 100; max-width: 86vw; text-align: center; pointer-events: none; }
  .toast.show { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }

  /* ---------- tab bar ---------- */
  .tabbar { position: fixed; left: 0; right: 0; bottom: 0; z-index: 40; display: flex; gap: 4px;
    background: color-mix(in srgb, var(--paper) 80%, transparent);
    -webkit-backdrop-filter: blur(22px) saturate(1.6); backdrop-filter: blur(22px) saturate(1.6);
    border-top: 1px solid var(--line);
    padding: 8px 10px calc(7px + env(safe-area-inset-bottom)); }
  .tab { flex: 1; border: none; background: none; padding: 4px 2px 2px; border-radius: 14px;
    display: flex; flex-direction: column; align-items: center; gap: 4px; position: relative; }
  .tabicon { font-size: 19px; line-height: 1; display: block; filter: grayscale(.9); opacity: .5;
    transition: filter var(--t-3) var(--e-soft), opacity var(--t-3) var(--e-soft),
      transform var(--t-3) var(--e-out); }
  .tablabel { font-size: 10px; font-weight: 700; letter-spacing: .01em; color: var(--muted);
    line-height: 1; transition: color var(--t-2) var(--e-soft); }
  .tab.active .tabicon { filter: none; opacity: 1; transform: translateY(-1px) scale(1.1); }
  .tab.active .tablabel { color: var(--ember-ink); }
  .tab:active .tabicon { transform: scale(.9); }
  .badge { position: absolute; top: -2px; left: 50%; margin-left: 6px; background: var(--ember);
    color: var(--on-ember); border-radius: 999px; font-size: 9.5px; font-weight: 800;
    padding: 1px 5px; display: none; line-height: 1.5; box-shadow: 0 0 0 2px var(--paper); }
  .badge.show { display: block; }

  /* ---------- grocery ---------- */
  .gwrap { padding: 16px 18px 28px; max-width: 720px; margin: 0 auto; }
  .gactions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; gap: 8px; }
  .gviews { display: flex; gap: 3px; background: var(--sand); padding: 3px; border-radius: 999px; }
  .gview { border: none; background: transparent; color: var(--ink-2); border-radius: 999px;
    padding: 7px 13px; font-size: 12.5px; font-weight: 700; line-height: 1;
    transition: background-color var(--t-2) var(--e-soft), color var(--t-2) var(--e-soft),
      transform var(--t-1) var(--e-out), box-shadow var(--t-2); }
  .gview:active { transform: scale(.95); }
  .gview.active { background: var(--card); color: var(--ink); box-shadow: var(--sh-sm); }
  .gclear { border: none; background: none; color: var(--muted); padding: 7px 2px;
    font-size: 12.5px; font-weight: 700; }
  .gaisle { font-family: var(--serif); font-size: 18px; font-weight: 700; margin: 26px 0 2px;
    padding-bottom: 9px; border-bottom: 1px solid var(--line-2); letter-spacing: -.02em;
    display: flex; align-items: center; gap: 9px; }
  .gaisle:first-child { margin-top: 0; }
  .gaisle .n { margin-left: auto; color: var(--muted); font-size: 11px; font-weight: 700;
    font-family: var(--sans); background: var(--sand); border-radius: 999px; padding: 3px 9px;
    letter-spacing: 0; }
  .grow { display: flex; align-items: flex-start; gap: 13px; padding: 13px 2px;
    border-bottom: 1px solid var(--line); transition: opacity var(--t-3) var(--e-soft); }
  .grow:last-child { border-bottom: none; }
  .grow.done { opacity: .45; }
  .gcheck { width: 24px; height: 24px; border-radius: 999px; border: 1.5px solid var(--line-2);
    flex: 0 0 24px; margin-top: 1px; display: flex; align-items: center; justify-content: center;
    color: var(--on-ember); font-size: 13px; font-weight: 800;
    transition: background-color var(--t-1), border-color var(--t-1), transform var(--t-1) var(--e-out); }
  .grow.done .gcheck { background: var(--ember); border-color: var(--ember); }
  .gname { font-size: 15px; font-weight: 700; text-transform: capitalize; letter-spacing: -.012em; line-height: 1.35; }
  .gtotal { color: var(--ember-ink); font-size: 11.5px; font-weight: 700; margin-left: 8px;
    text-transform: none; background: var(--ember-soft); padding: 2px 8px; border-radius: 999px;
    white-space: nowrap; letter-spacing: 0; }
  .grow.done .gname { text-decoration: line-through; }
  .grow.done .gtotal { color: var(--muted); background: var(--sand); }
  .gsub { color: var(--muted); font-size: 12px; margin-top: 4px; line-height: 1.5;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .gaisleico { font-family: var(--sans); font-size: 15px; line-height: 1; }
  @keyframes checkpop { 0% { transform: scale(1); } 45% { transform: scale(1.28); } 100% { transform: scale(1); } }

  /* ---------- install hint ---------- */
  .hint { margin: 12px 18px 0; background: var(--ember-soft); border-radius: 18px; padding: 14px 16px;
    font-size: 13px; line-height: 1.5; display: none; color: var(--ink); }
  .hint.show { display: block; }
  .hint b { color: var(--ember-ink); }
  .hint .x { float: right; border: none; background: none; color: var(--muted); font-size: 14px; padding: 0 0 0 8px; }

  /* ---------- convert + substitute ---------- */
  /* Colour emoji fight the warm palette; these two are the only strongly blue ones. */
  .emojibtn { filter: grayscale(1); opacity: .85; }
  .convrow { display: flex; align-items: baseline; gap: 12px; padding: 13px 2px;
    border-bottom: 1px solid var(--line); }
  .convrow:last-of-type { border-bottom: none; }
  .conveq { color: var(--muted); font-size: 15px; }
  .convval { font-family: var(--serif); font-size: 23px; font-weight: 700; letter-spacing: -.025em; }
  .convapprox { color: var(--muted); font-size: 11px; font-style: italic; margin-left: auto; }
  .convnote { margin-top: 14px; }
  .convai { color: var(--muted); font-size: 11.5px; margin: 12px 0 0; }
  #convbody > p { font-size: 15px; line-height: 1.6; margin: 8px 0 0; }
  .subtext { font-size: 14.5px; line-height: 1.6; white-space: pre-wrap; margin-top: 12px;
    max-height: 44vh; overflow-y: auto; }
  #subbody .convai { margin-top: 8px; }
  #explainsheet { z-index: 85; }

  /* ---------- weekly plan ---------- */
  .planhead { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .planweek { font-family: var(--serif); font-size: 21px; font-weight: 700; letter-spacing: -.025em; }
  .planday { background: var(--card); border: 1px solid var(--line); border-radius: 20px;
    padding: 14px 14px 9px; margin-bottom: 12px; box-shadow: var(--sh-sm); }
  .planday.today { border-color: color-mix(in srgb, var(--ember) 38%, transparent); box-shadow: var(--sh-md); }
  .plandayname { font-weight: 700; font-size: 10px; letter-spacing: .16em; text-transform: uppercase;
    color: var(--muted); margin-bottom: 8px; }
  .planday.today .plandayname { color: var(--ember-ink); }
  .planday.today .plandayname::after { content: " · today"; }
  .planslot { display: flex; align-items: center; gap: 10px; padding: 7px 0; }
  .planslot + .planslot { border-top: 1px solid var(--line); }
  .slotlbl { flex: 0 0 74px; font-size: 9.5px; color: var(--muted); font-weight: 700;
    letter-spacing: .08em; text-transform: uppercase; }
  .slotadd { flex: 1; text-align: left; border: 1px dashed var(--line-2); background: none;
    color: var(--muted); border-radius: 12px; padding: 9px 12px; font-size: 12.5px; font-weight: 600;
    transition: transform var(--t-1) var(--e-out), border-color var(--t-2), color var(--t-2); }
  .slotadd:active { transform: scale(.98); border-color: var(--ember); color: var(--ember-ink); }
  .slotrec { flex: 1; display: flex; align-items: center; gap: 9px; background: var(--sand);
    border: none; border-radius: 12px; padding: 6px 8px; min-width: 0; }
  .slotrec img { width: 32px; height: 32px; border-radius: 9px; object-fit: cover; flex: 0 0 32px; }
  .slotrec .t { flex: 1; font-size: 12.5px; font-weight: 700; white-space: nowrap; overflow: hidden;
    text-overflow: ellipsis; letter-spacing: -.01em; }
  .slotx { border: none; background: none; color: var(--muted); font-size: 13px; padding: 3px 4px; flex: 0 0 auto; }
  #plangrocery { margin-top: 6px; margin-bottom: 8px; }
  #picklist { max-height: 50vh; overflow-y: auto; margin-top: 14px; }
  .pickrow { display: flex; align-items: center; gap: 12px; padding: 10px 2px;
    border-bottom: 1px solid var(--line); cursor: pointer; }
  .pickrow:last-child { border-bottom: none; }
  .pickrow img, .pickrow .noimg { width: 46px; height: 46px; border-radius: 13px; object-fit: cover;
    flex: 0 0 46px; background: var(--sand); display: flex; align-items: center;
    justify-content: center; font-size: 19px; }
  .pickrow .t { flex: 1; min-width: 0; }
  .pickrow .tt { font-family: var(--serif); font-size: 15px; font-weight: 600; letter-spacing: -.015em;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pickrow .tc { font-size: 11.5px; color: var(--muted); margin-top: 2px; }

  /* ---------- cook mode ---------- */
  .cookbtn { border: none; background: var(--ember); color: var(--on-ember); border-radius: 999px;
    padding: 8px 16px; font-size: 11.5px; font-weight: 800; letter-spacing: .08em;
    text-transform: uppercase; box-shadow: 0 3px 12px var(--glow);
    transition: transform var(--t-1) var(--e-out); }
  .cookbtn:active { transform: scale(.94); }
  #cook { position: fixed; inset: 0; z-index: 70; background-color: var(--paper);
    background-image: var(--grain); display: none; flex-direction: column; }
  #cook.open { display: flex; animation: fadein .24s var(--e-soft); }
  @keyframes fadein { from { opacity: 0; } }
  #cook::before { content: ""; position: absolute; inset: 0; pointer-events: none;
    background: radial-gradient(120% 62% at 50% 4%, var(--cook-glow), transparent 72%); }
  .cooktop { display: flex; align-items: center; justify-content: space-between; gap: 12px;
    padding: calc(12px + env(safe-area-inset-top)) 16px 8px; position: relative; z-index: 1; }
  .cookcount { font-size: 10.5px; font-weight: 700; letter-spacing: .2em; color: var(--muted);
    text-transform: uppercase; text-align: center; flex: 1; }
  .cookdots { display: flex; gap: 7px; justify-content: center; flex-wrap: wrap;
    padding: 8px 24px 0; position: relative; z-index: 1; }
  .cookdot { width: 6px; height: 6px; border-radius: 999px; background: var(--line-2);
    transition: background-color var(--t-3) var(--e-soft), transform var(--t-3) var(--e-out); }
  .cookdot.on { background: var(--ember); }
  .cookdot.now { transform: scaleX(2.6); }
  .cookstep { flex: 1; display: flex; align-items: center; justify-content: center;
    padding: 16px 30px 26px; overflow-y: auto; cursor: pointer; position: relative; z-index: 1; }
  .cooktxt { font-family: var(--serif); font-size: 27px; line-height: 1.44; font-weight: 600;
    letter-spacing: -.018em; max-width: 620px; text-wrap: balance;
    animation: stepin .32s var(--e-out) both; }
  @keyframes stepin { from { opacity: 0; transform: translateY(12px); } }
  .cookdone { text-align: center; }
  .cookdone .big { font-size: 66px; margin-bottom: 14px; animation: bounceonce .55s var(--e-out); }
  @keyframes bounceonce { 0% { transform: scale(.6); opacity: 0; } 60% { transform: scale(1.12); } 100% { transform: scale(1); opacity: 1; } }
  .cookbottom { display: flex; gap: 10px; padding: 0 16px calc(18px + env(safe-area-inset-bottom));
    position: relative; z-index: 1; }
  .cooknavbtn { flex: 1; border: 1px solid var(--line); background: var(--card); color: var(--ink-2);
    border-radius: 18px; padding: 16px; font-size: 22px; line-height: 1; box-shadow: var(--sh-sm);
    transition: transform var(--t-1) var(--e-out); }
  .cooknavbtn:active { transform: scale(.95); }
  .cooknavbtn.next { background: var(--ember); border-color: var(--ember); color: var(--on-ember);
    box-shadow: 0 4px 18px var(--glow); }
  .cooknavbtn.ask { flex: 0 0 66px; background: var(--sand); border-color: transparent;
    color: var(--ink-2); font-weight: 800; font-size: 18px; }
  .cooknavbtn.off { opacity: .3; pointer-events: none; box-shadow: none; }
  #cooksheet { z-index: 80; }
  #cooksheet .ing { border-bottom: 1px solid var(--line); }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important;
      transition-duration: .01ms !important; scroll-behavior: auto !important; }
    .spin { animation: spin 1.4s linear infinite !important; }
  }
</style>
</head>
<body>
<div id="ptr"><span id="ptrspin">↻</span></div>
<header>
  <div class="titlerow">
    <div>
      <h1 id="apptitle">Simmer</h1>
      <div class="count" id="count"></div>
    </div>
    <div class="hbtns">
      <button class="addbtn ghost" id="refbtn" aria-label="Refresh">↻</button>
      <button class="addbtn" id="addbtn" aria-label="Add by link">+</button>
    </div>
  </div>
  <div class="searchwrap"><span class="searchico"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="11" cy="11" r="7"></circle><path d="M20 20l-3.8-3.8"></path></svg></span><input class="search" id="search" type="search" placeholder="Search recipes…"></div>
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

<div id="groceryview" class="gwrap" style="display:none">
  <div class="gactions">
    <div class="gviews">
      <button class="gview" id="gv-aisle">By aisle</button>
      <button class="gview" id="gv-recipe">By recipe</button>
    </div>
    <button class="gclear" id="gclear">Clear checked</button>
  </div>
  <div id="glist"></div>
  <div class="gempty" id="gempty" style="display:none">
    <div class="big">🧺</div>
    <h2>Nothing on the list</h2>
    <p>Open a recipe and tap <b>+</b> beside an ingredient, or <b>Add all to list</b>.</p>
  </div>
</div>

<nav class="tabbar">
  <button class="tab active" id="tab-recipes"><span class="tabicon">🍲</span><span class="tablabel">Recipes</span></button>
  <button class="tab" id="tab-plan"><span class="tabicon">📅</span><span class="tablabel">Plan</span></button>
  <button class="tab" id="tab-made"><span class="tabicon">⭐</span><span class="tablabel">Made</span></button>
  <button class="tab" id="tab-grocery"><span class="tabicon">🛒</span><span class="tablabel">Grocery</span><span class="badge" id="gbadge"></span></button>
</nav>

<div id="planview" class="gwrap" style="display:none">
  <div class="planhead">
    <button class="iconbtn" id="planprev" aria-label="Previous week">‹</button>
    <div class="planweek" id="planweek"></div>
    <button class="iconbtn" id="plannext" aria-label="Next week">›</button>
  </div>
  <div id="plandays"></div>
  <button class="primary" id="plangrocery">🛒 Add this week to grocery list</button>
</div>

<div class="overlay" id="detail"></div>

<div class="sheet" id="picksheet">
  <div class="sheetbody">
    <h2 id="picktitle">Add a meal</h2>
    <input class="urlinput" id="picksearch" type="search" placeholder="Search your recipes…" autocapitalize="off">
    <div id="picklist"></div>
  </div>
</div>

<div class="sheet" id="addsheet">
  <div class="sheetbody">
    <h2>Add a recipe</h2>
    <p>Paste any link — Instagram, TikTok, YouTube, Pinterest, or a recipe website.</p>
    <input class="urlinput" id="urlinput" type="url" placeholder="https://…" autocapitalize="off" autocorrect="off">
    <button class="primary" id="savebtn">Save recipe</button>
  </div>
</div>

<div class="sheet" id="explainsheet">
  <div class="sheetbody">
    <h2>What does this mean?</h2>
    <div class="expstep" id="expstep"></div>
    <div class="expbody" id="expbody"></div>
  </div>
</div>

<div id="cook">
  <div class="cooktop">
    <button class="iconbtn" id="cookx" aria-label="Exit cook mode">✕</button>
    <div class="cookcount" id="cookcount"></div>
    <button class="iconbtn" id="cookpeek" aria-label="Show ingredients">🧺</button>
  </div>
  <div class="cookdots" id="cookdots"></div>
  <div class="cookstep" id="cookstep"></div>
  <div class="cookbottom">
    <button class="cooknavbtn" id="cookprev" aria-label="Previous step">‹</button>
    <button class="cooknavbtn ask" id="cookask" aria-label="Explain this step">?</button>
    <button class="cooknavbtn next" id="cooknext" aria-label="Next step">›</button>
  </div>
</div>

<div class="sheet" id="convsheet">
  <div class="sheetbody">
    <h2>Ingredient help</h2>
    <div class="expstep" id="convtitle"></div>
    <div id="convbody"></div>
    <p class="convnote" id="convnote" style="display:none">Volume ↔ weight equivalents assume standard measuring cups and are approximate.</p>
  </div>
</div>

<div class="sheet" id="subsheet">
  <div class="sheetbody">
    <h2>Out of it? Try this</h2>
    <div class="expstep" id="subtitle"></div>
    <div id="subbody"></div>
  </div>
</div>

<div class="sheet" id="cooksheet">
  <div class="sheetbody">
    <h2>Ingredients</h2>
    <div id="cookings" style="max-height:52vh;overflow-y:auto"></div>
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
  var CATS = ["Breakfast","Lunch","Dinner","Meal Prep","Dessert","Snack","Drink","Sauce & Dip","Baking","Other"];
  var params = new URLSearchParams(location.search);
  var KEY = params.get("key") || localStorage.getItem("simmer_key") || "";
  if (params.get("key")) localStorage.setItem("simmer_key", params.get("key"));

  var state = { recipes: [], cat: "All", q: "", grocery: [], view: "recipes", madeStars: 0,
    gview: (function () { try { return localStorage.getItem("simmer_gview") || "aisle"; } catch (e) { return "aisle"; } })() };
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

  // Re-trigger the entrance animation on a whole-view swap (the node is reused, not rebuilt).
  function viewIn(node) {
    node.style.animation = "none";
    void node.offsetWidth;
    node.style.animation = "cardin .38s cubic-bezier(.22,.9,.3,1) both";
    node.addEventListener("animationend", function () { node.style.animation = ""; }, { once: true });
  }

  // ---------- list ----------
  function visible() {
    var q = state.q.toLowerCase();
    var rows = state.recipes.filter(function (r) {
      if (state.view === "made") {
        if (!r.rating) return false;
        if (state.madeStars && r.rating !== state.madeStars) return false;
      }
      else if (state.cat === "★") { if (!r.favorite) return false; }
      else if (state.cat !== "All" && r.category !== state.cat) return false;
      if (!q) return true;
      var hay = [r.title, r.caption, r.cuisine, r.author, (r.tags || []).join(" ")].join(" ").toLowerCase();
      return hay.indexOf(q) >= 0;
    });
    if (state.view === "made") {
      rows = rows.slice().sort(function (a, b) { return (b.rating || 0) - (a.rating || 0); });
    }
    return rows;
  }

  function renderChips() {
    var box = $("chips"); box.innerHTML = "";
    if (state.view === "made") {
      var sc = {};
      state.recipes.forEach(function (r) { if (r.rating) sc[r.rating] = (sc[r.rating] || 0) + 1; });
      var total = 0; Object.keys(sc).forEach(function (k) { total += sc[k]; });
      var sitems = [[0, "All", total]];
      [5, 4, 3, 2, 1].forEach(function (n) { if (sc[n]) sitems.push([n, n + " ★", sc[n]]); });
      sitems.forEach(function (it) {
        var b = el("button", "chip" + (state.madeStars === it[0] ? " active" : ""), it[1]);
        b.appendChild(el("span", "n", String(it[2])));
        b.onclick = function () { state.madeStars = it[0]; render(); };
        box.appendChild(b);
      });
      return;
    }
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
    $("empty").style.display = (state.view === "recipes" && !state.recipes.length) ? "block" : "none";
    if (state.view === "made" && !rows.length) {
      var ge = el("div", "gempty");
      ge.appendChild(el("div", "big", "⭐"));
      ge.appendChild(el("h2", null, "Nothing made yet"));
      var gp = el("p", null, "Cook something, give it a star rating, and it lands here — your greatest hits.");
      ge.appendChild(gp);
      grid.appendChild(ge);
      $("count").textContent = "recipes you've made";
      return;
    }
    $("count").textContent = state.view === "made"
      ? rows.length + " you have made"
      : state.recipes.length
        ? state.recipes.length + " recipe" + (state.recipes.length === 1 ? "" : "s") + " saved"
        : "your recipe library";
    rows.forEach(function (r, idx) {
      var card = el("div", "carditem");
      if (state.animateNext) {
        card.style.animation = "cardin .42s cubic-bezier(.22,.9,.3,1) both";
        card.style.animationDelay = Math.min(idx * 34, 340) + "ms";
        // "both" keeps the animation alive for the element's whole life; drop it once
        // it has played so the cards go back to being plain, unanimated nodes.
        card.addEventListener("animationend", function () {
          card.style.animation = ""; card.style.animationDelay = "";
        }, { once: true });
      }
      var tw = el("div", "thumbwrap");
      if (r.thumb_url) {
        tw.className = "thumbwrap loading";
        var img = document.createElement("img");
        img.loading = "lazy"; img.src = r.thumb_url; img.alt = "";
        img.onload = function () { tw.className = "thumbwrap loaded"; };
        img.onerror = function () { img.remove(); tw.className = "thumbwrap"; tw.appendChild(el("div", "noimg", "🍽️")); };
        tw.appendChild(img);
        if (img.complete && img.naturalWidth) tw.className = "thumbwrap loaded";
      } else tw.appendChild(el("div", "noimg", "🍽️"));
      if (r.favorite) tw.appendChild(el("div", "fav", "★"));
      card.appendChild(tw);
      var body = el("div", "cardbody");
      var kick = el("div", "cardkick");
      kick.appendChild(el("span", "catpill", r.category));
      if (r.rating) kick.appendChild(el("span", "ratepill", "★ " + r.rating));
      body.appendChild(kick);
      body.appendChild(el("div", "cardtitle", r.title || "Untitled"));
      var meta = [r.time_minutes ? fmtTime(r.time_minutes) : null, r.cuisine,
        r.author ? "@" + String(r.author).replace(/^@/, "") : null]
        .filter(Boolean).join(" · ");
      if (meta) body.appendChild(el("div", "cardmeta", meta));
      card.appendChild(body);
      card.onclick = function () { openDetail(r); };
      grid.appendChild(card);
    });
  }

  function render() { renderChips(); renderGrid(); state.animateNext = false; }

  function load() {
    return api("recipes").then(function (rows) {
      if (Array.isArray(rows)) { state.animateNext = true; state.recipes = rows; render(); }
      else toast(rows.message || "Could not load");
    }).catch(function () {});
  }

  // ---------- serving scaler (display-only; stored data never changes) ----------
  var UNI_FRAC = { "¼": 0.25, "½": 0.5, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3,
    "⅛": 0.125, "⅜": 0.375, "⅝": 0.625, "⅞": 0.875, "⅙": 1 / 6, "⅚": 5 / 6, "⅕": 0.2 };
  var NUM_TOK = "(?:\\d+\\s+\\d+\\s*\\/\\s*\\d+|\\d+\\s*\\/\\s*\\d+|\\d*\\s*[¼½¾⅓⅔⅛⅜⅝⅞⅙⅚⅕]|\\d+(?:\\.\\d+)?)";
  var SCALE_RE = new RegExp("^([\\s•*▢☐\\-–—]*)(" + NUM_TOK + ")(?:(\\s*[-–—]\\s*|\\s+to\\s+)(" + NUM_TOK + "))?");

  function qtyToNum(s) {
    s = s.trim();
    var m = s.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
    if (m) return +m[1] + (+m[2]) / (+m[3] || 1);
    m = s.match(/^(\d+)\s*\/\s*(\d+)$/);
    if (m) return (+m[1]) / (+m[2] || 1);
    m = s.match(/^(\d*)\s*([¼½¾⅓⅔⅛⅜⅝⅞⅙⅚⅕])$/);
    if (m) return (+m[1] || 0) + UNI_FRAC[m[2]];
    if (/^\d+(\.\d+)?$/.test(s)) return +s;
    return null;
  }

  function formatQty(n) {
    if (!isFinite(n) || n < 0) return null;
    var whole = Math.floor(n + 1e-9);
    var rem = n - whole;
    var fracs = [[0, ""], [0.125, "⅛"], [1 / 6, "⅙"], [0.2, "⅕"], [0.25, "¼"], [1 / 3, "⅓"],
      [0.375, "⅜"], [0.5, "½"], [0.625, "⅝"], [2 / 3, "⅔"], [0.75, "¾"], [5 / 6, "⅚"], [0.875, "⅞"], [1, ""]];
    var best = 0, bestD = 2;
    for (var i = 0; i < fracs.length; i++) {
      var d = Math.abs(rem - fracs[i][0]);
      if (d < bestD) { bestD = d; best = i; }
    }
    if (bestD <= 0.04) {
      if (fracs[best][0] === 1) return String(whole + 1);
      if (!fracs[best][1]) return String(whole);
      return (whole ? String(whole) : "") + fracs[best][1];
    }
    return String(Math.round(n * 100) / 100);
  }

  function scaleLine(text, f) {
    if (f === 1 || !text) return text;
    var m = String(text).match(SCALE_RE);
    if (!m || !m[2]) return text;
    var rest = String(text).slice(m[0].length);
    // "2% milk", "2nd" — a leading number that isn't a quantity
    if (/^\s*%/.test(rest) || /^(st|nd|rd|th)\b/i.test(rest)) return text;
    var q1 = qtyToNum(m[2]);
    if (q1 === null) return text;
    var s1 = formatQty(q1 * f);
    if (s1 === null) return text;
    var out = m[1] + s1;
    if (m[4]) {
      var q2 = qtyToNum(m[4]);
      if (q2 === null) return text;
      var s2 = formatQty(q2 * f);
      if (s2 === null) return text;
      out += m[3] + s2;
    }
    return out + rest;
  }

  // Quantities carry the visual weight of an ingredient line, so they are set apart
  // typographically (bold) rather than with colour — the list stays calm at a glance.
  function setIngLabel(lb, text) {
    var s = String(text);
    lb.textContent = "";
    var m = s.match(SCALE_RE);
    var q = (m && m[2]) ? s.slice(0, m[0].length).replace(/^[\s•*▢☐\-–—]+/, "").trim() : "";
    if (q) {
      lb.appendChild(el("span", "qty", q));
      lb.appendChild(document.createTextNode(s.slice(m[0].length)));
    } else {
      lb.textContent = s.replace(/^[\s•*▢☐\-–—]+/, "");
    }
  }

  // ---------- unit conversions (deterministic table; AI only as fallback) ----------
  var VOL_ML = { tsp: 4.92892, tbsp: 14.7868, floz: 29.5735, cup: 236.588, ml: 1, l: 1000, stick: 118.294 };
  var WT_G = { oz: 28.3495, lb: 453.592, g: 1, kg: 1000 };
  // grams per ml, from standard g-per-cup baking weights
  var DENSITY = [
    ["brown sugar", 0.930], ["powdered sugar|icing sugar|confectioners", 0.508],
    ["sugar", 0.845], ["flour", 0.507], ["cocoa", 0.423], ["peanut butter", 1.090],
    ["cream cheese", 0.980], ["butter", 0.959], ["honey", 1.437], ["maple syrup", 1.320],
    ["yogurt", 1.040], ["sour cream", 1.020], ["cream", 1.010], ["milk", 1.036],
    ["water", 1.002], ["oil", 0.921], ["rice", 0.824], ["oats|oatmeal", 0.402]
  ];

  function canonUnit(rest) {
    if (/^(fl\.?\s*oz|fluid\s+ounces?)\b/i.test(rest)) return "floz";
    var m = rest.match(/^([A-Za-z]+)\.?(?=\s|$)/);
    if (!m) return null;
    var w = m[1];
    if (/^(tsp|tsps|teaspoons?)$/i.test(w)) return "tsp";
    if (/^(tbsp|tbsps|tbs|tablespoons?)$/i.test(w)) return "tbsp";
    if (/^cups?$/i.test(w)) return "cup";
    if (/^(ml|milliliters?|millilitres?)$/i.test(w)) return "ml";
    if (/^(liters?|litres?)$/i.test(w)) return "l";
    if (/^(oz|ozs|ounces?)$/i.test(w)) return "oz";
    if (/^(lb|lbs|pounds?)$/i.test(w)) return "lb";
    if (/^(g|grams?)$/i.test(w)) return "g";
    if (/^(kg|kilograms?)$/i.test(w)) return "kg";
    if (/^sticks?$/i.test(w)) return "stick";
    return null;
  }

  function fmtDec(n) { return String(n >= 10 ? Math.round(n) : Math.round(n * 10) / 10); }
  function fmtUnit(n, u) {
    var s = formatQty(n);
    if (s === null) s = fmtDec(n);
    return s + " " + (u === "cup" ? (n > 1.001 ? "cups" : "cup") : u === "stick" ? (n > 1.001 ? "sticks" : "stick") : u);
  }
  function fmtGrams(g) { return g >= 1000 ? fmtDec(g / 1000) + " kg" : Math.round(g) + " g"; }

  // returns [{t: "8 tbsp", approx: bool}, ...] or null when the table can't handle the line
  function convertLine(text) {
    var m = String(text).match(SCALE_RE);
    if (!m || !m[2]) return null;
    var qty = qtyToNum(m[2]);
    if (qty === null || qty <= 0) return null;
    var rest = String(text).slice(m[0].length).replace(/^[\s.]+/, "");
    var unit = canonUnit(rest);
    if (!unit) return null;
    var name = rest.replace(/^(fl\.?\s*oz|fluid\s+ounces?|[A-Za-z]+\.?)\s*/i, "")
      .replace(/^of\s+/i, "").toLowerCase();
    var dens = null;
    for (var i = 0; i < DENSITY.length; i++) {
      if (new RegExp("\\b(" + DENSITY[i][0] + ")").test(name)) { dens = DENSITY[i][1]; break; }
    }
    // volume rows only get shown in ranges a cook would actually measure with that tool
    function volRows(ml, skip, approx) {
      var out = [];
      if (skip !== "tsp" && ml < 45) out.push({ t: fmtUnit(ml / VOL_ML.tsp, "tsp"), approx: approx });
      if (skip !== "tbsp" && ml >= 14 && ml <= 130) {
        var tb = ml / VOL_ML.tbsp;
        if (approx && tb >= 3) tb = Math.round(tb);
        out.push({ t: fmtUnit(tb, "tbsp"), approx: approx });
      }
      if (skip !== "cup" && ml >= 58) out.push({ t: fmtUnit(ml / VOL_ML.cup, "cup"), approx: approx });
      return out;
    }
    var rows = [];
    if (VOL_ML[unit] != null) {
      var ml = qty * VOL_ML[unit];
      if (unit === "stick") rows.push({ t: fmtUnit(ml / VOL_ML.tbsp, "tbsp") });
      rows = rows.concat(volRows(ml, unit === "stick" ? "tbsp" : unit, false));
      if (unit !== "ml" && unit !== "l") rows.push({ t: Math.round(ml) + " ml" });
      if (dens) rows.push({ t: fmtGrams(ml * dens), approx: true });
    } else if (WT_G[unit] != null) {
      var g = qty * WT_G[unit];
      if (unit !== "oz" && g >= 14 && g < 1000) rows.push({ t: fmtDec(g / WT_G.oz) + " oz" });
      if (unit !== "lb" && g >= 400) rows.push({ t: fmtDec(g / WT_G.lb) + " lb" });
      if (unit !== "g" && unit !== "kg") rows.push({ t: fmtGrams(g) });
      else if (unit === "g" && g >= 1000) rows.push({ t: fmtDec(g / 1000) + " kg" });
      if (dens) rows = rows.concat(volRows(g / dens, "", true));
    } else return null;
    return rows.length ? rows : null;
  }

  // ⇄ only appears on lines with a real measurement — "36 english muffins" has
  // nothing sensible to convert, so don't offer (or spend an AI call on) it
  function lineHasMeasure(text) {
    var m = String(text).match(SCALE_RE);
    if (!m || !m[2]) return false;
    var rest = String(text).slice(m[0].length).replace(/^[\s.]+/, "");
    return !!canonUnit(rest);
  }

  var convCache = {};
  var subCache = {};
  var convCtx = { line: "", title: "" };
  function openConvert(line, recipeTitle) {
    convCtx = { line: line, title: recipeTitle || "" };
    $("convtitle").textContent = line;
    var box = $("convbody"); box.innerHTML = "";
    $("convnote").style.display = "none";
    $("convsheet").classList.add("open");
    function showRows(rows) {
      box.innerHTML = "";
      var anyApprox = false;
      rows.forEach(function (rw) {
        var d = el("div", "convrow");
        d.appendChild(el("span", "conveq", "≈"));
        d.appendChild(el("span", "convval", rw.t));
        if (rw.approx) { d.appendChild(el("span", "convapprox", "approximate")); anyApprox = true; }
        box.appendChild(d);
      });
      if (anyApprox) $("convnote").style.display = "";
    }
    function showText(t) {
      box.innerHTML = "";
      var lines = t.split("\n").map(function (ln) { return ln.trim(); }).filter(Boolean);
      var measure = lines.filter(function (ln) { return /^[≈~]?\s*\d/.test(ln); });
      if (measure.length) {
        measure.forEach(function (ln) {
          var approx = /\(approx\.?\)/i.test(ln);
          var val = ln.replace(/^[≈~\s]+/, "").replace(/\s*\(approx\.?\)\s*/i, "");
          var d = el("div", "convrow");
          d.appendChild(el("span", "conveq", "≈"));
          d.appendChild(el("span", "convval", val));
          if (approx) d.appendChild(el("span", "convapprox", "approximate"));
          box.appendChild(d);
        });
      } else {
        box.appendChild(el("p", null, lines.join(" ")));
      }
      box.appendChild(el("p", "convai", "✨ AI estimate"));
    }
    var rows = convertLine(line);
    if (rows) { showRows(rows); return; }
    if (convCache[line]) { showText(convCache[line]); return; }
    box.appendChild(el("p", null, "Working it out…"));
    api("convert", { method: "POST", body: JSON.stringify({ line: line }) }).then(function (res) {
      if ($("convtitle").textContent !== line) return;
      if (res && res.text) { convCache[line] = res.text; showText(res.text); }
      else { box.innerHTML = ""; box.appendChild(el("p", null, (res && res.message) || "Couldn't convert this one.")); }
    }).catch(function () {
      if ($("convtitle").textContent !== line) return;
      box.innerHTML = ""; box.appendChild(el("p", null, "Network error — try again."));
    });
  }

  function fmtTime(min) {
    min = Math.round(min);
    if (min >= 60) {
      var h = Math.floor(min / 60), mm = min % 60;
      return h + " hr" + (mm ? " " + mm + " min" : "");
    }
    return min + " min";
  }

  // ---------- share ----------
  function shareText(r) {
    var lines = [];
    lines.push("🍲 " + (r.title || "Recipe"));
    if (r.author) lines.push("by " + String(r.author).replace(/^@/, ""));
    lines.push("");
    if (r.url) lines.push("📎 " + r.url);
    if (r.source_url && r.source_url !== r.url) lines.push("📖 Recipe: " + r.source_url);
    function section(title, ings, steps, ai) {
      if (title) { lines.push(""); lines.push("— " + title + " —"); }
      if (ings && ings.length) {
        lines.push(""); lines.push("INGREDIENTS");
        ings.forEach(function (t) { lines.push("• " + t); });
      }
      if (steps && steps.length) {
        lines.push(""); lines.push(ai ? "STEPS (AI-suggested — double-check against the video)" : "STEPS");
        steps.forEach(function (t, i) { lines.push((i + 1) + ". " + t); });
      }
    }
    var subs = Array.isArray(r.sub_recipes) ? r.sub_recipes : [];
    if (subs.length) {
      subs.forEach(function (sr) { section(sr.title, sr.ingredients, sr.steps, !!sr.ai_steps); });
    } else {
      section(null, r.ingredients, r.steps, (r.tags || []).indexOf("ai-steps") >= 0);
    }
    lines.push("");
    lines.push("Shared from Simmer 🍲");
    return lines.join("\n");
  }

  function shareRecipe(r) {
    var text = shareText(r);
    if (navigator.share) {
      navigator.share({ title: r.title || "Recipe", text: text }).catch(function () {});
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () { toast("Recipe copied — paste it anywhere"); },
        function () { toast("Couldn't copy the recipe"); }
      );
    } else {
      toast("Sharing isn't supported in this browser");
    }
  }

  // ---------- detail ----------
  function embedSrc(r) {
    if (r.platform === "tiktok") return "https://www.tiktok.com/embed/v2/" + String(r.shortcode).replace(/^tt-/, "");
    if (r.platform === "youtube") return "https://www.youtube.com/embed/" + String(r.shortcode).replace(/^yt-/, "");
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
    var shbtn = el("button", "iconbtn emojibtn", "📤");
    shbtn.title = "Share this recipe";
    shbtn.onclick = function () { shareRecipe(r); };
    var fav = el("button", "iconbtn", r.favorite ? "★" : "☆");
    fav.style.color = r.favorite ? "var(--honey)" : "";
    fav.onclick = function () {
      r.favorite = !r.favorite;
      fav.textContent = r.favorite ? "★" : "☆"; fav.style.color = r.favorite ? "var(--honey)" : "";
      api("recipes/" + r.id, { method: "PATCH", body: JSON.stringify({ favorite: r.favorite }) }).then(load);
    };
    var del = el("button", "iconbtn", "🗑");
    del.onclick = function () {
      if (!confirm("Delete “" + (r.title || "this recipe") + "”?")) return;
      api("recipes/" + r.id, { method: "DELETE" }).then(function () { closeDetail(); toast("Deleted"); load(); });
    };
    actions.appendChild(re); actions.appendChild(shbtn); actions.appendChild(fav); actions.appendChild(del);
    top.appendChild(back); top.appendChild(actions);
    ov.appendChild(top);

    var c = el("div", "dcontent");

    if (r.platform === "web") {
      // saved web pages have no video — show the cached page image instead
      if (r.thumb_url) {
        var ww = el("div", "webimgwrap");
        var wimg = document.createElement("img");
        wimg.src = r.thumb_url; wimg.alt = "";
        wimg.onerror = function () { ww.remove(); };
        ww.appendChild(wimg);
        c.appendChild(ww);
      }
    } else {
      var vw = el("div", "videowrap" + (r.platform === "youtube" ? " wide" : ""));
      var ifr = document.createElement("iframe");
      ifr.src = embedSrc(r);
      ifr.setAttribute("allowfullscreen", "");
      ifr.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture");
      ifr.setAttribute("scrolling", "no");
      vw.appendChild(ifr);
      c.appendChild(vw);
    }

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
    if (r.time_minutes) mr.appendChild(el("span", "mchip", "⏱ ~" + fmtTime(r.time_minutes)));
    if (r.cuisine) mr.appendChild(el("span", "mchip", r.cuisine));
    if (r.source_url && r.source_url !== r.url) {
      var src = document.createElement("a");
      src.className = "mchip link"; src.href = r.source_url; src.target = "_blank"; src.rel = "noopener";
      var host = "recipe source";
      try { host = new URL(r.source_url).hostname.replace(/^www\./, ""); } catch (err) {}
      src.textContent = "Recipe: " + host + " ↗";
      mr.appendChild(src);
    }
    var link = document.createElement("a");
    link.className = "mchip link"; link.href = r.url; link.target = "_blank"; link.rel = "noopener";
    link.textContent = (r.platform === "tiktok" ? "Open in TikTok ↗"
      : r.platform === "youtube" ? "Open on YouTube ↗"
      : r.platform === "web" ? "Open original ↗"
      : "Open in Instagram ↗");
    mr.appendChild(link);
    c.appendChild(mr);

    if (r.nutrition && r.nutrition.calories) {
      var nu = r.nutrition;
      var nr = el("div", "nutrow");
      var nutCell = function (v, lab) {
        var d = el("div", "nutchip");
        d.appendChild(el("span", "nutval", v));
        d.appendChild(el("span", "nutlab", lab));
        nr.appendChild(d);
      };
      nutCell(String(nu.calories), "cal");
      if (nu.protein_g) nutCell(nu.protein_g + "g", "protein");
      if (nu.carbs_g) nutCell(nu.carbs_g + "g", "carbs");
      if (nu.fat_g) nutCell(nu.fat_g + "g", "fat");
      c.appendChild(nr);
      c.appendChild(el("div", "nutlabel",
        "per serving" + (nu.servings > 1 ? " · makes ~" + nu.servings + " servings" : "") + " · ✨ AI estimate"));
    }

    var scaleF = 1;          // resets every time a recipe is opened
    var scaleables = [];     // row updaters run when the scale changes

    var ingUid = 0;
    function ingSection(items, listTitle) {
      var s1 = el("div", "section");
      var sh = el("div", "sechead");
      sh.appendChild(el("h3", null, "Ingredients"));
      var addAll = el("button", "addall", "🛒 Add all to list");
      var allIds = null;
      addAll.onclick = function () {
        addAll.disabled = true;
        if (allIds) {
          removeFromGrocery(allIds).then(function (ok) {
            addAll.disabled = false;
            if (ok) { allIds = null; addAll.textContent = "🛒 Add all to list"; }
          });
          return;
        }
        addAll.textContent = "Adding…";
        var toAdd = items.map(function (t) { return scaleLine(t, scaleF); });
        addToGrocery(toAdd, { id: r.id, title: listTitle }).then(function (ids) {
          addAll.disabled = false;
          allIds = ids;
          addAll.textContent = ids ? "✓ Added (tap to undo)" : "🛒 Add all to list";
        });
      };
      sh.appendChild(addAll);
      s1.appendChild(sh);
      items.forEach(function (it) {
        var row = el("div", "ing");
        var cb = document.createElement("input"); cb.type = "checkbox"; cb.id = "ing" + (ingUid++);
        var lb = document.createElement("label"); lb.htmlFor = cb.id; lb.style.flex = "1";
        setIngLabel(lb, it);
        scaleables.push(function () { setIngLabel(lb, scaleLine(it, scaleF)); });
        cb.onchange = function () { row.classList.toggle("done", cb.checked); };
        var swap = el("button", "cartbtn convbtn", "⟳");
        swap.title = "Don't have it? Find a substitute";
        swap.onclick = function () { openSubstitute(scaleLine(it, scaleF), r.title); };
        var conv = null;
        if (lineHasMeasure(it)) {
          conv = el("button", "cartbtn convbtn", "⇄");
          conv.title = "Show measurement equivalents";
          conv.onclick = function () { openConvert(scaleLine(it, scaleF), r.title); };
        }
        var cart = el("button", "cartbtn", "+");
        cart.title = "Add to grocery list";
        var myIds = null;
        cart.onclick = function () {
          cart.disabled = true;
          if (myIds) {
            removeFromGrocery(myIds).then(function (ok) {
              cart.disabled = false;
              if (ok) { myIds = null; cart.textContent = "+"; }
            });
            return;
          }
          addToGrocery([scaleLine(it, scaleF)], { id: r.id, title: listTitle }).then(function (ids) {
            cart.disabled = false;
            myIds = ids;
            cart.textContent = ids ? "✓" : "+";
          });
        };
        row.appendChild(cb); row.appendChild(lb); row.appendChild(swap);
        if (conv) row.appendChild(conv);
        row.appendChild(cart);
        s1.appendChild(row);
      });
      return s1;
    }
    function stepSection(items, aiFlag, cookTitle, cookIngs) {
      var s2 = el("div", "section");
      var sh2 = el("div", "sechead");
      sh2.appendChild(el("h3", null, "Steps"));
      var cbtn = el("button", "cookbtn", "▶ Cook");
      cbtn.onclick = function () {
        openCookMode(cookTitle, items, (cookIngs || []).map(function (t) { return scaleLine(t, scaleF); }));
      };
      sh2.appendChild(cbtn);
      s2.appendChild(sh2);
      if (aiFlag) {
        var note = el("div", "norecipe", "✨ AI-suggested steps — the post only listed ingredients, so double-check against the video.");
        note.style.marginBottom = "12px";
        s2.appendChild(note);
      }
      var ol = el("ol", "steps");
      items.forEach(function (st) {
        var li = el("li");
        li.appendChild(el("span", "steptext", st));
        var wb = el("button", "whybtn", "?");
        wb.title = "Explain this step";
        wb.onclick = function (ev) { ev.stopPropagation(); explainStep(st, r); };
        li.appendChild(wb);
        ol.appendChild(li);
      });
      s2.appendChild(ol);
      return s2;
    }

    var ings = Array.isArray(r.ingredients) ? r.ingredients : [];
    var steps = Array.isArray(r.steps) ? r.steps : [];
    var subs = Array.isArray(r.sub_recipes) ? r.sub_recipes : [];

    var hasAnyIngs = ings.length > 0 || subs.some(function (s) { return (s.ingredients || []).length > 0; });
    if (hasAnyIngs) {
      var srow = el("div", "scalerow");
      srow.appendChild(el("span", "scalelbl", "Scale recipe"));
      var customChip;
      function activate(chip) {
        var kids = srow.querySelectorAll(".scalechip");
        for (var ki = 0; ki < kids.length; ki++) kids[ki].classList.remove("active");
        chip.classList.add("active");
        scaleables.forEach(function (fn) { fn(); });
      }
      [[0.5, "½×"], [1, "1×"], [2, "2×"], [3, "3×"]].forEach(function (opt) {
        var sb = el("button", "scalechip" + (opt[0] === 1 ? " active" : ""), opt[1]);
        sb.onclick = function () {
          scaleF = opt[0];
          customChip.textContent = "Custom";
          activate(sb);
        };
        srow.appendChild(sb);
      });
      customChip = el("button", "scalechip", "Custom");
      customChip.onclick = function () {
        var v = prompt("Scale by how much? For example 1.5 for one-and-a-half batches, or 5 to feed a crowd.",
          customChip.textContent === "Custom" ? "" : String(scaleF));
        if (v === null) return;
        v = parseFloat(String(v).replace(",", ".").replace(/[x×\s]/g, ""));
        if (!isFinite(v) || v <= 0 || v > 25) { toast("Enter a number between 0 and 25, like 1.5"); return; }
        scaleF = v;
        customChip.textContent = (formatQty(v) || String(v)) + "×";
        activate(customChip);
      };
      srow.appendChild(customChip);
      c.appendChild(srow);
    }

    if (subs.length) {
      subs.forEach(function (sr, k) {
        c.appendChild(el("div", "subhead", (k + 1) + ". " + (sr.title || "Recipe " + (k + 1))));
        var si = Array.isArray(sr.ingredients) ? sr.ingredients : [];
        var ss = Array.isArray(sr.steps) ? sr.steps : [];
        if (si.length) c.appendChild(ingSection(si, sr.title || r.title));
        if (ss.length) c.appendChild(stepSection(ss, !!sr.ai_steps, sr.title || r.title, si));
      });
    } else if (ings.length || steps.length) {
      if (ings.length) c.appendChild(ingSection(ings, r.title));
      if (steps.length) c.appendChild(stepSection(steps, (r.tags || []).indexOf("ai-steps") >= 0, r.title, ings));
    } else {
      var nb = el("div", "section");
      nb.appendChild(el("div", "norecipe",
        r.platform === "web"
          ? "No written recipe found on that page — tap ↻ up top to try again, or tap Open original to view the page."
          : "No written recipe in this video's caption — watch the video above, tap ↻ up top to search again, or open it on " +
            (r.platform === "tiktok" ? "TikTok" : r.platform === "youtube" ? "YouTube" : "Instagram") + " for details."));
      c.appendChild(nb);
    }

    var sMine = el("div", "section");
    sMine.appendChild(el("h3", null, "My Rating & Notes"));
    var starRow = el("div", "stars");
    function paintStars() {
      starRow.innerHTML = "";
      for (var si = 1; si <= 5; si++) (function (n) {
        var on = (r.rating || 0) >= n;
        var sb = el("button", "star" + (on ? " on" : ""), on ? "★" : "☆");
        sb.onclick = function () {
          r.rating = (r.rating === n) ? null : n;
          paintStars();
          var target = starRow.children[n - 1];
          if (target && target.animate) target.animate(
            [{ transform: "scale(1)" }, { transform: "scale(1.35)" }, { transform: "scale(1)" }],
            { duration: 220, easing: "ease-out" });
          api("recipes/" + r.id, { method: "PATCH", body: JSON.stringify({ rating: r.rating }) }).then(load);
        };
        starRow.appendChild(sb);
      })(si);
    }
    paintStars();
    sMine.appendChild(starRow);
    var ta = document.createElement("textarea");
    ta.className = "notesbox";
    ta.placeholder = "What did you change? How did it turn out?";
    ta.value = r.notes || "";
    ta.onblur = function () {
      var v = ta.value.trim();
      if (v === (r.notes || "")) return;
      r.notes = v;
      api("recipes/" + r.id, { method: "PATCH", body: JSON.stringify({ notes: v }) })
        .then(function () { toast("Notes saved"); load(); });
    };
    sMine.appendChild(ta);
    c.appendChild(sMine);

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
    if ($("cook").classList.contains("open")) { closeCookMode(true); return; }
    var ov = $("detail");
    if (ov.classList.contains("open")) { ov.classList.remove("open"); ov.innerHTML = ""; document.body.style.overflow = ""; }
  });

  // ---------- cook mode ----------
  var cook = { steps: [], ings: [], i: 0, title: "" };
  var cookWake = null;
  var cookAte = 0;
  function cookWakeAcquire() {
    try {
      if (navigator.wakeLock && navigator.wakeLock.request) {
        navigator.wakeLock.request("screen").then(function (wl) { cookWake = wl; }).catch(function () {});
      }
    } catch (e) { /* unsupported — screen may sleep, that's fine */ }
  }
  function cookWakeRelease() {
    try { if (cookWake) { cookWake.release().catch(function () {}); cookWake = null; } } catch (e) {}
  }
  function renderCook() {
    var n = cook.steps.length;
    var done = cook.i >= n;
    $("cookcount").textContent = done ? cook.title : "Step " + (cook.i + 1) + " of " + n;
    var dots = $("cookdots"); dots.innerHTML = "";
    for (var d = 0; d < n; d++) {
      dots.appendChild(el("div", "cookdot" + (done || d < cook.i ? " on" : "") + (d === cook.i ? " on now" : "")));
    }
    var box = $("cookstep"); box.innerHTML = "";
    if (done) {
      var dn = el("div", "cooktxt cookdone");
      dn.appendChild(el("div", "big", "🍽️"));
      dn.appendChild(el("div", null, "That's everything — enjoy!"));
      var fin = el("button", "primary", "Finish cooking");
      fin.style.marginTop = "22px";
      fin.onclick = function (ev) { ev.stopPropagation(); closeCookMode(false); };
      dn.appendChild(fin);
      box.appendChild(dn);
    } else {
      box.appendChild(el("div", "cooktxt", cook.steps[cook.i]));
    }
    $("cooknext").style.visibility = done ? "hidden" : "";
    $("cookask").style.visibility = done ? "hidden" : "";
    // Dimmed rather than hidden: the row keeps its balance and the buttons never move.
    $("cookprev").classList.toggle("off", cook.i === 0);
  }
  function cookGo(delta) {
    var ni = cook.i + delta;
    if (ni < 0 || ni > cook.steps.length) return;
    cook.i = ni;
    renderCook();
  }
  function openCookMode(title, steps, ings) {
    cook = { steps: steps, ings: ings || [], i: 0, title: title || "" };
    $("cook").classList.add("open");
    renderCook();
    cookWakeAcquire();
    history.pushState({ cook: 1 }, "");
  }
  function closeCookMode(fromPop) {
    $("cook").classList.remove("open");
    $("cooksheet").classList.remove("open");
    cookWakeRelease();
    if (!fromPop && history.state && history.state.cook) history.back();
  }
  $("cookx").onclick = function () { closeCookMode(false); };
  $("cookprev").onclick = function () { cookGo(-1); };
  $("cooknext").onclick = function () { cookGo(1); };
  $("cookask").onclick = function () {
    if (cook.i < cook.steps.length) explainStep(cook.steps[cook.i], { title: cook.title });
  };
  $("cookstep").addEventListener("click", function (e) {
    if (cook.i >= cook.steps.length) return;
    if (Date.now() - cookAte < 400) return;
    cookGo((e.clientX || 0) > window.innerWidth / 2 ? 1 : -1);
  });
  var cookTX = null, cookTY = 0;
  $("cook").addEventListener("touchstart", function (e) {
    cookTX = e.touches.length === 1 ? e.touches[0].clientX : null;
    cookTY = e.touches.length === 1 ? e.touches[0].clientY : 0;
  }, { passive: true });
  $("cook").addEventListener("touchend", function (e) {
    if (cookTX === null || !e.changedTouches.length) return;
    var dx = e.changedTouches[0].clientX - cookTX;
    var dy = e.changedTouches[0].clientY - cookTY;
    cookTX = null;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      cookAte = Date.now();
      cookGo(dx < 0 ? 1 : -1);
    }
  }, { passive: true });
  $("cookpeek").onclick = function () {
    var box = $("cookings"); box.innerHTML = "";
    if (!cook.ings.length) {
      box.appendChild(el("p", null, "No ingredient list for this recipe."));
    }
    cook.ings.forEach(function (it) {
      var row = el("div", "ing");
      var lb = el("label", null); lb.style.flex = "1";
      setIngLabel(lb, it);
      row.appendChild(lb);
      box.appendChild(row);
    });
    $("cooksheet").classList.add("open");
  };
  $("cooksheet").addEventListener("click", function (e) {
    if (e.target === $("cooksheet")) $("cooksheet").classList.remove("open");
  });
  $("convsheet").addEventListener("click", function (e) {
    if (e.target === $("convsheet")) $("convsheet").classList.remove("open");
  });
  var subCtx = { line: "", title: "" };
  function openSubstitute(line, recipeTitle) {
    subCtx = { line: line, title: recipeTitle || "" };
    $("subtitle").textContent = line;
    var box = $("subbody"); box.innerHTML = "";
    $("subsheet").classList.add("open");
    var ck = subCtx.title + "|" + line;
    function show(t) {
      box.innerHTML = "";
      box.appendChild(el("div", "subtext", t));
      box.appendChild(el("p", "convai", "✨ AI suggestion — taste as you go"));
    }
    if (subCache[ck]) { show(subCache[ck]); return; }
    box.appendChild(el("p", "subtext", "Asking the kitchen coach…"));
    api("substitute", { method: "POST", body: JSON.stringify({ ingredient: line, title: subCtx.title }) }).then(function (res) {
      if (subCtx.line !== line) return;
      if (res && res.text) { subCache[ck] = res.text; show(res.text); }
      else { box.innerHTML = ""; box.appendChild(el("p", "subtext", (res && res.message) || "Couldn't get suggestions — try again.")); }
    }).catch(function () {
      if (subCtx.line !== line) return;
      box.innerHTML = ""; box.appendChild(el("p", "subtext", "Network error — try again."));
    });
  }
  $("subsheet").addEventListener("click", function (e) {
    if (e.target === $("subsheet")) $("subsheet").classList.remove("open");
  });
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden && $("cook").classList.contains("open")) cookWakeAcquire();
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
    if (!document.hidden && KEY) { load(); loadGrocery(); }
  });
  window.addEventListener("pageshow", function (e) { if (e.persisted && KEY) { load(); loadGrocery(); } });

  // ---------- pull down to refresh ----------
  var ptrStartY = null, ptrDist = 0;
  function overlayShowing() {
    return $("detail").classList.contains("open") || document.querySelector(".sheet.open");
  }
  document.addEventListener("touchstart", function (e) {
    if (window.scrollY > 2 || overlayShowing() || e.touches.length !== 1) { ptrStartY = null; return; }
    ptrStartY = e.touches[0].clientY; ptrDist = 0;
  }, { passive: true });
  document.addEventListener("touchmove", function (e) {
    if (ptrStartY === null) return;
    var dy = e.touches[0].clientY - ptrStartY;
    var p = $("ptr");
    if (dy <= 0 || window.scrollY > 2) { ptrDist = 0; p.style.transform = "translateY(-70px)"; return; }
    ptrDist = Math.min(dy * 0.45, 95);
    p.style.transition = "none";
    p.style.transform = "translateY(" + (ptrDist - 58) + "px)";
    $("ptrspin").style.transform = "rotate(" + Math.round(ptrDist * 4) + "deg)";
  }, { passive: true });
  document.addEventListener("touchend", function () {
    if (ptrStartY === null) return;
    ptrStartY = null;
    var p = $("ptr");
    p.style.transition = "";
    if (ptrDist >= 55) {
      p.style.transform = "translateY(14px)";
      $("ptrspin").classList.add("spin");
      Promise.all([load(), loadGrocery()]).then(function () {
        $("ptrspin").classList.remove("spin");
        p.style.transform = "translateY(-70px)";
      });
    } else {
      p.style.transform = "translateY(-70px)";
    }
    ptrDist = 0;
  });

  // ---------- grocery list ----------
  function loadGrocery() {
    return api("grocery").then(function (rows) {
      if (Array.isArray(rows)) { state.grocery = rows; renderGrocery(); }
    }).catch(function () {});
  }

  function groceryGroups() {
    var map = {}, order = [];
    state.grocery.forEach(function (g) {
      if (!map[g.item]) { map[g.item] = []; order.push(g.item); }
      map[g.item].push(g);
    });
    return order.map(function (k) {
      var rows = map[k];
      return { name: k, rows: rows, done: rows.every(function (r) { return r.checked; }) };
    });
  }

  var AISLE_ORDER = ["Produce", "Meat & Seafood", "Dairy & Eggs", "Bakery", "Pantry", "Spices & Baking", "Frozen", "Other"];
  var AISLE_EMOJI = { "Produce": "🥬", "Meat & Seafood": "🥩", "Dairy & Eggs": "🥚", "Bakery": "🥖",
    "Pantry": "🥫", "Spices & Baking": "🧂", "Frozen": "🧊", "Other": "🛒" };

  // "2 cups flour" + "1 cup flour" → one combined "3 cups" total for the group header
  function parseQtyUnit(text) {
    var m = String(text).match(SCALE_RE);
    if (!m || !m[2]) return null;
    var q = qtyToNum(m[2]);
    if (q === null || q <= 0) return null;
    if (m[4]) { var q2 = qtyToNum(m[4]); if (q2 !== null && q2 > q) q = q2; } // ranges: shop for the max
    var rest = String(text).slice(m[0].length).replace(/^[\s.]+/, "");
    if (/^\s*%/.test(rest)) return null;
    var canon = canonUnit(rest);
    var word = null;
    if (!canon) {
      // "1 large egg" — size adjectives are not counters
      var wm = rest.match(/^(?:(?:large|medium|small|extra|whole|fresh)[\s-]+)*([A-Za-z]+)/i);
      word = wm ? wm[1].toLowerCase().replace(/s$/, "") : "";
    }
    return { q: q, canon: canon, word: word };
  }

  function groupTotal(g) {
    var ml = 0, wg = 0, counts = {}, countOrder = [];
    g.rows.forEach(function (r) {
      var p = parseQtyUnit(r.text);
      if (!p) return;
      if (p.canon && VOL_ML[p.canon] != null) ml += p.q * VOL_ML[p.canon];
      else if (p.canon && WT_G[p.canon] != null) wg += p.q * WT_G[p.canon];
      else {
        var k = p.word || "";
        if (!(k in counts)) { counts[k] = 0; countOrder.push(k); }
        counts[k] += p.q;
      }
    });
    // "13 tbsp butter" + "150 g butter": merge across families when we know the density
    var merged = false;
    if (ml > 0 && wg > 0) {
      for (var di = 0; di < DENSITY.length; di++) {
        if (new RegExp("\\b(" + DENSITY[di][0] + ")").test(g.name.toLowerCase())) {
          ml += wg / DENSITY[di][1];
          wg = 0; merged = true;
          break;
        }
      }
    }
    var parts = [];
    if (ml > 0) {
      var cupsV = ml / VOL_ML.cup;
      var niceCup = [0.25, 1 / 3, 0.5, 2 / 3, 0.75].some(function (n) { return Math.abs(cupsV - n) < 0.02; });
      if (cupsV >= 0.995 || niceCup) parts.push(fmtUnit(cupsV, "cup"));
      else if (ml >= 14) parts.push(fmtUnit(ml / VOL_ML.tbsp, "tbsp"));
      else parts.push(fmtUnit(ml / VOL_ML.tsp, "tsp"));
    }
    if (wg > 0) {
      if (wg >= 454) parts.push(fmtDec(wg / WT_G.lb) + " lb");
      else if (wg >= 28) parts.push(fmtDec(wg / WT_G.oz) + " oz");
      else parts.push(Math.round(wg) + " g");
    }
    countOrder.forEach(function (k) {
      var n = counts[k];
      var num = formatQty(n); if (num === null) num = fmtDec(n);
      // the word after the number is often the item itself ("3 eggs") — the header
      // already names it, so only spell out real counters like "cloves" or "cans"
      if (k && g.name.toLowerCase().indexOf(k) < 0) parts.push(num + " " + k + (n > 1.001 ? "s" : ""));
      else parts.push(num);
    });
    if (!parts.length) return null;
    return (merged ? "≈ " : "") + parts.join(" + ");
  }

  function groceryRow(g) {
    var row = el("div", "grow" + (g.done ? " done" : ""));
    var cb = el("div", "gcheck", g.done ? "✓" : "");
    var body = el("div", null); body.style.flex = "1";
    var nameLine = el("div", "gname", g.name);
    var total = groupTotal(g);
    if (total) nameLine.appendChild(el("span", "gtotal", total));
    body.appendChild(nameLine);
    var subs = g.rows.map(function (r) {
      return r.text + (r.recipe_title ? " — " + r.recipe_title : "");
    });
    body.appendChild(el("div", "gsub", subs.join(" · ")));
    row.appendChild(cb); row.appendChild(body);
    row.onclick = function () {
      if (row._busy) return;
      row._busy = true;
      var ids = g.rows.map(function (r) { return r.id; });
      var target = !g.done;
      g.rows.forEach(function (r) { r.checked = target; });
      // Land the check first, then let the list re-sort — reordering mid-tap feels jumpy.
      row.classList.toggle("done", target);
      cb.textContent = target ? "✓" : "";
      if (cb.animate) cb.animate(
        [{ transform: "scale(1)" }, { transform: "scale(1.32)" }, { transform: "scale(1)" }],
        { duration: 260, easing: "cubic-bezier(.22,.9,.3,1)" });
      api("grocery", { method: "PATCH", body: JSON.stringify({ ids: ids, checked: target }) }).catch(function () {});
      setTimeout(renderGrocery, 300);
    };
    return row;
  }

  function renderGrocery() {
    var groups = groceryGroups();
    var open = groups.filter(function (g) { return !g.done; });
    var done = groups.filter(function (g) { return g.done; });
    var list = $("glist"); list.innerHTML = "";
    $("gempty").style.display = groups.length ? "none" : "block";
    var badge = $("gbadge");
    badge.textContent = String(open.length);
    badge.classList.toggle("show", open.length > 0);
    $("gv-aisle").classList.toggle("active", state.gview === "aisle");
    $("gv-recipe").classList.toggle("active", state.gview !== "aisle");
    if (state.gview === "aisle") {
      var byAisle = {};
      groups.forEach(function (g) {
        var a = null;
        for (var i = 0; i < g.rows.length && !a; i++) a = g.rows[i].aisle;
        if (AISLE_ORDER.indexOf(a) < 0) a = "Other";
        (byAisle[a] = byAisle[a] || []).push(g);
      });
      AISLE_ORDER.forEach(function (a) {
        var gs = byAisle[a];
        if (!gs || !gs.length) return;
        var head = el("div", "gaisle");
        head.appendChild(el("span", "gaisleico", AISLE_EMOJI[a]));
        head.appendChild(el("span", null, a));
        var openCount = gs.filter(function (g) { return !g.done; }).length;
        if (openCount) head.appendChild(el("span", "n", String(openCount)));
        list.appendChild(head);
        gs.filter(function (g) { return !g.done; })
          .concat(gs.filter(function (g) { return g.done; }))
          .forEach(function (g) { list.appendChild(groceryRow(g)); });
      });
    } else {
      open.concat(done).forEach(function (g) { list.appendChild(groceryRow(g)); });
    }
  }

  $("gv-aisle").onclick = function () {
    state.gview = "aisle";
    try { localStorage.setItem("simmer_gview", "aisle"); } catch (e) {}
    renderGrocery();
  };
  $("gv-recipe").onclick = function () {
    state.gview = "recipe";
    try { localStorage.setItem("simmer_gview", "recipe"); } catch (e) {}
    renderGrocery();
  };

  function addToGrocery(texts, recipe) {
    var items = texts.map(function (t) {
      return { text: t, recipe_id: recipe.id, recipe_title: recipe.title };
    });
    return api("grocery", { method: "POST", body: JSON.stringify({ items: items }) }).then(function (res) {
      if (res && res.status === "added") {
        toast(texts.length === 1 ? "Added to grocery list — tap again to undo" : "Added " + texts.length + " items — tap again to undo");
        loadGrocery();
        return (res.items || []).map(function (x) { return x.id; });
      }
      toast((res && res.message) || "Could not add"); return null;
    }).catch(function () { toast("Network error"); return null; });
  }

  function removeFromGrocery(ids) {
    return api("grocery?ids=" + ids.join(","), { method: "DELETE" }).then(function () {
      toast("Removed from grocery list");
      loadGrocery();
      return true;
    }).catch(function () { toast("Network error"); return false; });
  }

  // ---------- "what does this mean?" ----------
  var expCache = {};
  function explainStep(step, recipe) {
    var sh = $("explainsheet");
    $("expstep").textContent = step;
    var bodyEl = $("expbody");
    sh.classList.add("open");
    var ck = (recipe.title || "") + "|" + step;
    if (expCache[ck]) { bodyEl.textContent = expCache[ck]; return; }
    bodyEl.textContent = "Asking the kitchen coach…";
    api("explain", { method: "POST", body: JSON.stringify({ step: step, title: recipe.title }) }).then(function (res) {
      if (res && res.explanation) { expCache[ck] = res.explanation; bodyEl.textContent = res.explanation; }
      else bodyEl.textContent = (res && res.message) || "Couldn't get an explanation — try again.";
    }).catch(function () { bodyEl.textContent = "Network error — try again."; });
  }
  $("explainsheet").addEventListener("click", function (e) {
    if (e.target === $("explainsheet")) $("explainsheet").classList.remove("open");
  });

  $("gclear").onclick = function () {
    if (!state.grocery.some(function (g) { return g.checked; })) { toast("Nothing checked yet"); return; }
    api("grocery?checked=true", { method: "DELETE" }).then(function () { loadGrocery(); toast("Cleared"); });
  };

  // ---------- weekly meal planner ----------
  var SLOTS = [["breakfast", "Breakfast"], ["lunch", "Lunch"], ["dinner", "Dinner"]];
  var DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function mondayOf(d) {
    var x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
    return x;
  }
  function pad2(n) { return (n < 10 ? "0" : "") + n; }
  function ymd(d) { return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()); }
  state.planStart = mondayOf(new Date());
  state.plan = [];
  var pickTarget = null;

  function recipeById(id) {
    for (var i = 0; i < state.recipes.length; i++) if (state.recipes[i].id === id) return state.recipes[i];
    return null;
  }

  function loadPlan() {
    return api("plan?start=" + ymd(state.planStart)).then(function (rows) {
      if (Array.isArray(rows)) { state.plan = rows; renderPlan(); }
    }).catch(function () {});
  }

  function renderPlan() {
    var end = new Date(state.planStart); end.setDate(end.getDate() + 6);
    $("planweek").textContent = MONTHS[state.planStart.getMonth()] + " " + state.planStart.getDate() +
      " – " + (end.getMonth() === state.planStart.getMonth() ? "" : MONTHS[end.getMonth()] + " ") + end.getDate();
    var box = $("plandays"); box.innerHTML = "";
    var todayS = ymd(new Date());
    for (var di = 0; di < 7; di++) {
      (function (di) {
        var d = new Date(state.planStart); d.setDate(d.getDate() + di);
        var dayS = ymd(d);
        var card = el("div", "planday" + (dayS === todayS ? " today" : ""));
        card.appendChild(el("div", "plandayname", DAY_NAMES[di] + " " + MONTHS[d.getMonth()] + " " + d.getDate()));
        SLOTS.forEach(function (sl) {
          var row = el("div", "planslot");
          row.appendChild(el("span", "slotlbl", sl[1]));
          var entries = state.plan.filter(function (p) { return p.day === dayS && p.slot === sl[0]; });
          if (!entries.length) {
            var add = el("button", "slotadd", "+ Add");
            add.onclick = function () { openPicker(dayS, sl[0], DAY_NAMES[di] + " " + sl[1].toLowerCase()); };
            row.appendChild(add);
          } else {
            entries.forEach(function (p) {
              var r = recipeById(p.recipe_id);
              var chip = el("div", "slotrec");
              if (r && r.thumb_url) {
                var im = document.createElement("img"); im.src = r.thumb_url; im.alt = "";
                chip.appendChild(im);
              }
              var t = el("span", "t", r ? (r.title || "Untitled") : "(deleted recipe)");
              t.onclick = function () { if (r) openDetail(r); };
              chip.appendChild(t);
              var x = el("button", "slotx", "✕");
              x.setAttribute("aria-label", "Remove from plan");
              x.onclick = function (ev) {
                ev.stopPropagation();
                api("plan/" + p.id, { method: "DELETE" }).then(function () {
                  state.plan = state.plan.filter(function (q) { return q.id !== p.id; });
                  renderPlan();
                }).catch(function () { toast("Network error"); });
              };
              chip.appendChild(x);
              row.appendChild(chip);
            });
          }
          card.appendChild(row);
        });
        box.appendChild(card);
      })(di);
    }
  }

  function openPicker(dayS, slot, label) {
    pickTarget = { day: dayS, slot: slot };
    $("picktitle").textContent = "Add to " + label;
    $("picksearch").value = "";
    renderPickList("");
    $("picksheet").classList.add("open");
  }

  function renderPickList(q) {
    var list = $("picklist"); list.innerHTML = "";
    q = q.toLowerCase();
    var rows = state.recipes.filter(function (r) {
      if (!q) return true;
      return ([r.title, r.cuisine, r.author, r.category].join(" ").toLowerCase().indexOf(q) >= 0);
    }).slice(0, 30);
    if (!rows.length) list.appendChild(el("p", null, "No recipes match."));
    rows.forEach(function (r) {
      var row = el("div", "pickrow");
      if (r.thumb_url) {
        var im = document.createElement("img"); im.src = r.thumb_url; im.alt = "";
        row.appendChild(im);
      } else row.appendChild(el("div", "noimg", "🍽️"));
      var t = el("div", "t");
      t.appendChild(el("div", "tt", r.title || "Untitled"));
      t.appendChild(el("div", "tc", [r.category, r.cuisine].filter(Boolean).join(" · ")));
      row.appendChild(t);
      row.onclick = function () {
        if (!pickTarget) return;
        $("picksheet").classList.remove("open");
        api("plan", { method: "POST", body: JSON.stringify({ day: pickTarget.day, slot: pickTarget.slot, recipe_id: r.id }) })
          .then(function (res) {
            if (res && res.entry) { state.plan.push(res.entry); renderPlan(); toast("Planned: " + (r.title || "recipe")); }
            else toast((res && res.message) || "Could not plan");
          }).catch(function () { toast("Network error"); });
      };
      list.appendChild(row);
    });
  }
  $("picksearch").addEventListener("input", function (e) { renderPickList(e.target.value); });
  $("picksheet").addEventListener("click", function (e) {
    if (e.target === $("picksheet")) $("picksheet").classList.remove("open");
  });

  $("planprev").onclick = function () {
    state.planStart.setDate(state.planStart.getDate() - 7);
    renderPlan(); loadPlan();
  };
  $("plannext").onclick = function () {
    state.planStart.setDate(state.planStart.getDate() + 7);
    renderPlan(); loadPlan();
  };

  $("plangrocery").onclick = function () {
    var seen = {};
    var items = [];
    state.plan.forEach(function (p) {
      if (seen[p.recipe_id]) return;
      seen[p.recipe_id] = true;
      var r = recipeById(p.recipe_id);
      if (!r) return;
      var ings = Array.isArray(r.ingredients) ? r.ingredients.slice() : [];
      (Array.isArray(r.sub_recipes) ? r.sub_recipes : []).forEach(function (sr) {
        (sr.ingredients || []).forEach(function (t) { ings.push(t); });
      });
      ings.forEach(function (t) {
        items.push({ text: t, recipe_id: r.id, recipe_title: r.title });
      });
    });
    if (!items.length) { toast("Nothing planned this week yet"); return; }
    var b = $("plangrocery"); b.disabled = true;
    api("grocery", { method: "POST", body: JSON.stringify({ items: items.slice(0, 100) }) }).then(function (res) {
      b.disabled = false;
      if (res && res.status === "added") {
        toast("Added " + (res.items || []).length + " ingredients to the grocery list");
        loadGrocery();
      } else toast((res && res.message) || "Could not add");
    }).catch(function () { b.disabled = false; toast("Network error"); });
  };

  function setView(v) {
    state.view = v;
    var rec = v === "recipes", made = v === "made", groc = v === "grocery", plan = v === "plan";
    var full = groc || plan; // views that replace the grid entirely
    $("tab-recipes").classList.toggle("active", rec);
    $("tab-plan").classList.toggle("active", plan);
    $("tab-made").classList.toggle("active", made);
    $("tab-grocery").classList.toggle("active", groc);
    $("chips").style.display = full ? "none" : "";
    $("grid").style.display = full ? "none" : "";
    document.querySelector(".searchwrap").style.display = full ? "none" : "";
    $("groceryview").style.display = groc ? "" : "none";
    $("planview").style.display = plan ? "" : "none";
    if (made) state.madeStars = 0;
    if (full) $("empty").style.display = "none";
    $("apptitle").textContent = groc ? "Grocery" : plan ? "Plan" : made ? "Made" : "Simmer";
    if (groc) { $("count").textContent = "your shopping list"; loadGrocery(); viewIn($("groceryview")); }
    else if (plan) { $("count").textContent = "meals for the week"; renderPlan(); loadPlan(); viewIn($("planview")); }
    else { state.animateNext = true; render(); }
  }
  $("tab-recipes").onclick = function () { setView("recipes"); };
  $("tab-plan").onclick = function () { setView("plan"); };
  $("tab-made").onclick = function () { setView("made"); };
  $("tab-grocery").onclick = function () { setView("grocery"); };

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
  else { load(); loadGrocery(); }
})();
</script>
</body>
</html>`;
