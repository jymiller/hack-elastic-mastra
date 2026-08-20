import {
  registerApiRoute,
  type ContextWithMastra,
} from "@mastra/core/server";

import {
  createDamaLaPodcastQrSvg,
  damaLaPodcastUrl,
} from "../../lib/dama-la.js";

const damaLaQrSvg = await createDamaLaPodcastQrSvg();

const page = String.raw`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Architecture · Great Questions AI</title>
    <style>
      :root {
        color-scheme: dark;
        --night: #080b0e;
        --ink: #f4f0e7;
        --soft: #aaa9a3;
        --line: rgba(244, 240, 231, .13);
        --mint: #5dffa1;
        --violet: #c787ff;
        --amber: #ffc557;
        --blue: #55d6ff;
      }
      * { box-sizing: border-box; }
      html, body { margin: 0; min-height: 100%; }
      body {
        color: var(--ink);
        background:
          radial-gradient(circle at 12% 5%, rgba(50, 145, 102, .17), transparent 30rem),
          radial-gradient(circle at 87% 10%, rgba(107, 78, 189, .2), transparent 34rem),
          var(--night);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      a { color: inherit; }
      header {
        min-height: 72px; padding: 13px 28px; display: flex; align-items: center;
        justify-content: space-between; gap: 20px; border-bottom: 1px solid var(--line);
        background: rgba(8, 11, 14, .8); backdrop-filter: blur(18px); position: sticky; top: 0; z-index: 10;
      }
      .brand { display: flex; align-items: center; gap: 12px; }
      .mark { width: 42px; height: 42px; display: grid; place-items: center; border: 1px solid rgba(152,239,193,.5); border-radius: 50%; color: var(--mint); font: 19px Georgia, serif; }
      .brand strong, .brand span { display: block; }
      .brand strong { font-size: 14px; }
      .brand span { color: var(--soft); font-size: 10px; }
      nav { display: flex; flex-wrap: wrap; gap: 7px; }
      nav a { padding: 8px 11px; border: 1px solid var(--line); border-radius: 999px; color: var(--soft); text-decoration: none; font-size: 10px; }
      nav a:hover { color: var(--ink); border-color: rgba(152,239,193,.4); }
      main { width: min(1380px, 100%); margin: auto; padding: 70px clamp(22px, 6vw, 92px) 100px; }
      .hero { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(300px, .8fr); gap: 80px; align-items: end; margin-bottom: 72px; }
      .eyebrow { color: var(--mint); font-size: 10px; font-weight: 700; letter-spacing: .19em; text-transform: uppercase; }
      h1 { max-width: 850px; margin: 12px 0 0; font: 400 clamp(46px, 7vw, 92px)/.91 Georgia, serif; letter-spacing: -.055em; }
      .lede { color: var(--soft); font: 17px/1.7 Georgia, serif; max-width: 480px; margin: 0; }
      .live-line { margin-top: 26px; display: flex; align-items: center; gap: 10px; color: var(--soft); font-size: 11px; }
      .pulse { width: 7px; height: 7px; border-radius: 50%; background: var(--mint); box-shadow: 0 0 0 6px rgba(152,239,193,.08); }
      .architecture { border: 0; background: transparent; overflow: visible; }
      .qr-panel {
        display: grid; grid-template-columns: minmax(0, 1fr) minmax(340px, 430px);
        align-items: center; gap: 72px; margin-bottom: 72px; padding: 46px 54px;
        border: 1px solid var(--line); border-radius: 22px; background: rgba(14,17,20,.72);
      }
      .qr-panel h2 { max-width: 600px; margin: 12px 0 14px; font: 400 clamp(38px, 5vw, 68px)/.98 Georgia, serif; letter-spacing: -.045em; }
      .qr-panel p { margin: 0; color: var(--soft); font-size: 15px; }
      .qr-code { display: block; padding: 14px; border-radius: 18px; background: #fff; box-shadow: 0 24px 70px rgba(0,0,0,.35); }
      .qr-code svg { display: block; width: 100%; height: auto; }
      .row { position: relative; padding: 58px 0; border: 0; }
      .row-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 30px; }
      .row-label { color: var(--soft); font-size: 9px; font-weight: 750; letter-spacing: .16em; text-transform: uppercase; }
      .row-note { color: #747672; font-size: 9px; }
      .nodes { display: grid; grid-template-columns: repeat(12, 1fr); gap: 54px; }
      .node {
        grid-column: span 4; min-height: 96px; padding: 18px 19px;
        border: 1px solid color-mix(in srgb, var(--tone, var(--mint)) 72%, transparent);
        border-radius: 13px; background: color-mix(in srgb, var(--tone, var(--mint)) 5%, rgba(8,11,14,.74));
        box-shadow: 0 0 26px color-mix(in srgb, var(--tone, var(--mint)) 12%, transparent), inset 0 0 22px color-mix(in srgb, var(--tone, var(--mint)) 4%, transparent);
        position: relative; overflow: visible;
      }
      .node:not(:last-child)::after {
        content: "→"; position: absolute; left: calc(100% + 17px); top: 50%;
        transform: translateY(-50%); width: 20px; color: var(--tone, var(--mint));
        font: 22px/1 ui-monospace, SFMono-Regular, Menlo, monospace; text-shadow: 0 0 13px currentColor;
      }
      .node.wide { grid-column: span 6; }
      .node.quarter { grid-column: span 3; }
      .node strong { display: block; margin-bottom: 7px; color: var(--tone, var(--mint)); font-size: 14px; text-shadow: 0 0 12px color-mix(in srgb, var(--tone, var(--mint)) 35%, transparent); }
      .node p { margin: 0; max-width: 30ch; color: var(--soft); font-size: 10px; line-height: 1.45; }
      .node .tag { display: inline-block; margin-top: 10px; color: var(--tone, var(--mint)); font-size: 7px; font-weight: 750; letter-spacing: .1em; text-transform: uppercase; }
      .node.mint { --tone: var(--mint); }
      .node.violet { --tone: var(--violet); }
      .node.amber { --tone: var(--amber); }
      .node.blue { --tone: var(--blue); }
      .flow { height: 72px; display: grid; place-items: center; color: var(--mint); font-size: 26px; text-shadow: 0 0 14px rgba(93,255,161,.7); }
      .stat { font: 27px Georgia, serif; color: var(--ink); }
      .indexes { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 10px; }
      .indexes span { padding: 4px 6px; border: 1px solid var(--line); border-radius: 6px; color: var(--soft); font: 8px ui-monospace, SFMono-Regular, Menlo, monospace; }
      footer { margin-top: 46px; color: #797b77; font-size: 10px; text-align: center; }
      @media (max-width: 960px) { .hero, .qr-panel { grid-template-columns: 1fr; gap: 28px; } .qr-code { width: min(430px, 100%); } .node, .node.quarter { grid-column: span 6; } .node::after { display: none; } }
      @media (max-width: 620px) { header { padding: 12px 15px; } nav a:last-child { display: none; } main { padding-top: 40px; } .qr-panel { padding: 28px; } .row { padding: 24px; } .node, .node.wide, .node.quarter { grid-column: span 12; } }
    </style>
  </head>
  <body>
    <header>
      <div class="brand"><div class="mark">GQ</div><div><strong>Solution Architecture</strong><span>Great Questions AI · live system map</span></div></div>
      <nav><a href="/great-questions">Research memory</a><a href="/podcast-prep">Podcast prep</a><a href="/demo">Demo view</a><a href="/agents" target="_blank" rel="noreferrer">Mastra Studio ↗</a></nav>
    </header>
    <main>
      <section class="hero">
        <div><div class="eyebrow">One evidence system · four agents</div><h1>From a question to a point of view.</h1></div>
        <div><p class="lede">Mastra coordinates the work. Elasticsearch keeps the evidence. Traces show what happened.</p><div class="live-line"><i class="pulse"></i><span id="live">Checking the live corpus…</span></div></div>
      </section>

      <section class="qr-panel" aria-label="DAMA LA Podcast QR code">
        <div><div class="eyebrow">Watch the source</div><h2>DAMA LA Podcast</h2><p>Scan to open the full YouTube playlist.</p></div>
        <a class="qr-code" href="${damaLaPodcastUrl}" target="_blank" rel="noreferrer" aria-label="Open the DAMA LA Podcast playlist">${damaLaQrSvg}</a>
      </section>

      <section class="architecture" aria-label="Great Questions solution architecture">
        <div class="row">
          <div class="row-head"><span class="row-label">01 · Experience</span></div>
          <div class="nodes">
            <div class="node wide mint"><strong>Research Memory</strong><p>Ask the past. See the evidence.</p><span class="tag">Explore</span></div>
            <div class="node wide violet"><strong>Podcast Prep</strong><p>Know the guest. Ask better questions.</p><span class="tag">Prepare</span></div>
          </div>
        </div>
        <div class="flow">↓</div>
        <div class="row">
          <div class="row-head"><span class="row-label">02 · Mastra agents</span></div>
          <div class="nodes">
            <div class="node quarter mint"><strong>Great Questions</strong><p>Find your point of view.</p><span class="tag">Supervisor</span></div>
            <div class="node quarter violet"><strong>Prep</strong><p>Build the interview brief.</p><span class="tag">Supervisor</span></div>
            <div class="node quarter blue"><strong>Industry Research</strong><p>Search current sources.</p><span class="tag">Specialist</span></div>
            <div class="node quarter amber"><strong>Mesh Loader</strong><p>Add episodes safely.</p><span class="tag">Specialist</span></div>
          </div>
        </div>
        <div class="flow">↓</div>
        <div class="row">
          <div class="row-head"><span class="row-label">03 · Foundation</span></div>
          <div class="nodes">
            <div class="node mint"><strong>Elasticsearch</strong><p>Searchable podcast memory.</p><div class="indexes"><span>memories</span><span>relations</span><span>decisions</span></div></div>
            <div class="node blue"><strong>OpenRouter</strong><p>Models + current web research.</p><span class="tag">Primary</span></div>
            <div class="node violet"><strong>Novita · GLM-5.3</strong><p>Automatic model fallback.</p><span class="tag">Ready</span></div>
          </div>
        </div>
        <div class="flow">↓</div>
        <div class="row">
          <div class="row-head"><span class="row-label">04 · Proof</span></div>
          <div class="nodes">
            <div class="node quarter mint"><strong><span class="stat" id="memory-count">—</span> memories</strong><p>Live now.</p></div>
            <div class="node quarter amber"><strong>420 chunks</strong><p>Mesh data staged.</p></div>
            <div class="node quarter blue"><strong>Traces + cost</strong><p>Grouped by prep workspace.</p></div>
            <div class="node quarter violet"><strong>Evidence evals</strong><p>Quality, not conformity.</p></div>
          </div>
        </div>
      </section>

      <footer>Great Questions AI · Mastra + Elasticsearch</footer>
    </main>
    <script>
      fetch("/great-questions/api/status").then(function (response) {
        if (!response.ok) throw new Error("status");
        return response.json();
      }).then(function (data) {
        document.getElementById("memory-count").textContent = String(data.memories);
        document.getElementById("live").textContent = "Elasticsearch connected · " + data.memories + " memories · " + data.relations + " relations · " + data.decisions + " decisions";
      }).catch(function () {
        document.getElementById("live").textContent = "Architecture available · live corpus status unavailable";
      });
    </script>
  </body>
</html>`;

export const architectureUiRoutes = [
  registerApiRoute("/architecture", {
    method: "GET",
    requiresAuth: false,
    handler: (context: ContextWithMastra) => context.html(page),
  }),
];
