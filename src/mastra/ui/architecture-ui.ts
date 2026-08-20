import {
  registerApiRoute,
  type ContextWithMastra,
} from "@mastra/core/server";

import {
  createDamaLaPodcastQrSvg,
  damaLaPodcastUrl,
} from "../../lib/dama-la.js";
import {
  appHeaderCss,
  renderAppHeader,
} from "./app-navigation.js";

const damaLaQrSvg = await createDamaLaPodcastQrSvg();

const page = String.raw`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="The live Great Questions AI solution architecture." />
    <title>Architecture · Great Questions AI</title>
    <style>
      :root {
        color-scheme: dark;
        --night: #070a0c;
        --panel: rgba(14, 18, 20, .7);
        --ink: #f5f1e8;
        --soft: #9da39f;
        --line: rgba(245, 241, 232, .12);
        --mint: #5dffa1;
        --violet: #c787ff;
        --amber: #ffc557;
        --blue: #55d6ff;
        --nav-tone: var(--mint);
      }
      * { box-sizing: border-box; }
      html, body { margin: 0; min-height: 100%; }
      body {
        color: var(--ink);
        background:
          radial-gradient(circle at 8% 0%, rgba(93, 255, 161, .11), transparent 30rem),
          radial-gradient(circle at 86% 8%, rgba(199, 135, 255, .12), transparent 34rem),
          var(--night);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      a { color: inherit; }
      header {
        min-height: 68px;
        padding: 12px 28px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
        position: sticky;
        top: 0;
        z-index: 10;
        border-bottom: 1px solid var(--line);
        background: rgba(7, 10, 12, .82);
        backdrop-filter: blur(18px);
      }
      .brand { display: flex; align-items: center; gap: 12px; text-decoration: none; }
      .mark {
        width: 40px; height: 40px; display: grid; place-items: center;
        border: 1px solid rgba(93, 255, 161, .48); border-radius: 50%;
        color: var(--mint); font: 18px Georgia, serif;
      }
      .brand strong, .brand span { display: block; }
      .brand strong { font-size: 13px; }
      .brand span { color: var(--soft); font-size: 9px; letter-spacing: .08em; text-transform: uppercase; }
      ${appHeaderCss}

      main { width: min(1480px, 100%); margin: auto; padding: 72px clamp(22px, 5vw, 76px) 100px; }
      .hero {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 260px;
        align-items: center;
        gap: clamp(44px, 8vw, 120px);
        margin-bottom: 64px;
      }
      .eyebrow { color: var(--mint); font-size: 9px; font-weight: 800; letter-spacing: .2em; text-transform: uppercase; }
      h1 { max-width: 900px; margin: 13px 0 18px; font: 400 clamp(50px, 7vw, 94px)/.91 Georgia, serif; letter-spacing: -.055em; }
      .lede { max-width: 660px; margin: 0; color: var(--soft); font: 16px/1.7 Georgia, serif; }
      .live-line { display: flex; align-items: center; gap: 10px; margin-top: 24px; color: var(--soft); font-size: 10px; }
      .pulse { width: 7px; height: 7px; border-radius: 50%; background: var(--mint); box-shadow: 0 0 0 6px rgba(93, 255, 161, .08), 0 0 18px rgba(93, 255, 161, .6); }
      .qr-card { padding: 18px; border: 1px solid var(--line); border-radius: 18px; background: var(--panel); }
      .qr-card a { display: block; padding: 10px; border-radius: 12px; background: white; }
      .qr-card svg { display: block; width: 100%; height: auto; }
      .qr-card strong { display: block; margin-top: 13px; color: var(--mint); font: 18px Georgia, serif; }
      .qr-card span { color: var(--soft); font-size: 9px; }

      .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 84px; }
      .metric { min-height: 92px; padding: 17px; border-top: 1px solid var(--tone); background: linear-gradient(180deg, color-mix(in srgb, var(--tone) 7%, transparent), transparent); }
      .metric:nth-child(1) { --tone: var(--amber); }
      .metric:nth-child(2) { --tone: var(--mint); }
      .metric:nth-child(3) { --tone: var(--violet); }
      .metric:nth-child(4) { --tone: var(--blue); }
      .metric b { display: block; color: var(--tone); font: 30px Georgia, serif; }
      .metric span { color: var(--soft); font-size: 9px; letter-spacing: .08em; text-transform: uppercase; }

      .section-head { display: flex; align-items: end; justify-content: space-between; gap: 24px; margin-bottom: 34px; }
      .section-head h2 { margin: 9px 0 0; font: 400 clamp(34px, 4vw, 55px)/1 Georgia, serif; letter-spacing: -.04em; }
      .section-head p { max-width: 400px; margin: 0; color: var(--soft); font-size: 11px; line-height: 1.6; }
      .pipeline { display: grid; grid-template-columns: 1fr 28px 1fr 28px 1.1fr 28px 1fr 28px 1fr; align-items: stretch; }
      .stage {
        min-height: 210px;
        padding: 20px;
        border: 1px solid color-mix(in srgb, var(--tone) 55%, transparent);
        border-radius: 14px;
        background: color-mix(in srgb, var(--tone) 4%, rgba(7,10,12,.78));
        box-shadow: 0 0 30px color-mix(in srgb, var(--tone) 8%, transparent);
      }
      .stage.sources { --tone: var(--amber); }
      .stage.shape { --tone: var(--blue); }
      .stage.search { --tone: var(--mint); }
      .stage.agents { --tone: var(--violet); }
      .stage.experience { --tone: var(--blue); }
      .number { color: var(--tone); font: 700 8px ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .15em; }
      .stage h3 { margin: 16px 0 12px; color: var(--tone); font: 400 22px Georgia, serif; }
      .stage p { margin: 0 0 16px; color: var(--soft); font-size: 10px; line-height: 1.55; }
      .stage ul { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; }
      .stage li { padding-top: 8px; border-top: 1px solid var(--line); color: var(--ink); font-size: 9px; }
      .stage li span { float: right; color: var(--soft); }
      .connector { display: grid; place-items: center; color: var(--mint); font: 21px ui-monospace, SFMono-Regular, Menlo, monospace; text-shadow: 0 0 14px currentColor; }

      .memory-model { display: grid; grid-template-columns: 1.4fr .6fr; gap: 14px; margin-top: 18px; }
      .model-card { padding: 22px; border: 1px solid var(--line); border-radius: 14px; background: rgba(255,255,255,.015); }
      .model-card.active { border-color: rgba(93,255,161,.34); }
      .model-card.future { border-style: dashed; }
      .model-card small { color: var(--mint); font-size: 8px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; }
      .model-card.future small { color: var(--amber); }
      .model-card h3 { margin: 10px 0 7px; font: 400 23px Georgia, serif; }
      .model-card p { margin: 0; color: var(--soft); font-size: 10px; line-height: 1.55; }
      code { color: var(--mint); font: 9px ui-monospace, SFMono-Regular, Menlo, monospace; }

      .agent-map { margin-top: 76px; }
      .agent-rail { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
      .agent { padding: 20px; border-left: 2px solid var(--tone); background: linear-gradient(90deg, color-mix(in srgb, var(--tone) 7%, transparent), transparent); }
      .agent:nth-child(1) { --tone: var(--mint); }
      .agent:nth-child(2) { --tone: var(--violet); }
      .agent:nth-child(3) { --tone: var(--blue); }
      .agent:nth-child(4) { --tone: var(--amber); }
      .agent b { display: block; margin-bottom: 8px; color: var(--tone); font: 17px Georgia, serif; }
      .agent span { color: var(--soft); font-size: 9px; line-height: 1.5; }

      .rails { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-top: 76px; }
      .rail { min-height: 150px; padding: 23px; border-top: 1px solid var(--tone); }
      .rail:nth-child(1) { --tone: var(--blue); }
      .rail:nth-child(2) { --tone: var(--violet); }
      .rail:nth-child(3) { --tone: var(--amber); }
      .rail small { color: var(--tone); font-size: 8px; letter-spacing: .16em; text-transform: uppercase; }
      .rail h3 { margin: 12px 0 8px; font: 400 24px Georgia, serif; }
      .rail p { margin: 0; color: var(--soft); font-size: 10px; line-height: 1.55; }
      footer { margin-top: 76px; padding-top: 22px; border-top: 1px solid var(--line); color: #737974; font-size: 9px; text-align: center; }

      @media (max-width: 1120px) {
        .pipeline { grid-template-columns: 1fr; gap: 10px; }
        .connector { height: 26px; transform: rotate(90deg); }
        .stage { min-height: 0; }
      }
      @media (max-width: 820px) {
        header { flex-wrap: wrap; padding: 12px 16px; }
        .gq-nav { width: 100%; }
        main { padding-top: 44px; }
        .hero { grid-template-columns: 1fr; gap: 28px; }
        .qr-card { width: min(270px, 100%); }
        .summary, .agent-rail, .rails { grid-template-columns: repeat(2, 1fr); }
        .memory-model { grid-template-columns: 1fr; }
      }
      @media (max-width: 520px) {
        .summary, .agent-rail, .rails { grid-template-columns: 1fr; }
        .section-head { display: block; }
        .section-head p { margin-top: 14px; }
      }
    </style>
  </head>
  <body>
    ${renderAppHeader("architecture")}
    <main>
      <section class="hero">
        <div>
          <div class="eyebrow">Evidence in · better questions out</div>
          <h1>A point of view you can trace.</h1>
          <p class="lede">Podcast transcripts become dated, searchable evidence. Mastra agents retrieve it, compare it with current research, and show the receipts.</p>
          <div class="live-line"><i class="pulse"></i><span id="live">Checking the live evidence store…</span></div>
        </div>
        <aside class="qr-card" aria-label="DAMA LA Podcast QR code">
          <a href="${damaLaPodcastUrl}" target="_blank" rel="noreferrer" aria-label="Open the DAMA LA Podcast playlist">${damaLaQrSvg}</a>
          <strong>DAMA LA Podcast</strong><span>Scan to watch the source.</span>
        </aside>
      </section>

      <section class="summary" aria-label="Live system summary">
        <div class="metric"><b>25</b><span id="corpus-state">6 live · 19 ingestion-ready</span></div>
        <div class="metric"><b id="memory-count">—</b><span>Searchable memories</span></div>
        <div class="metric"><b>4</b><span>Mastra agents</span></div>
        <div class="metric"><b>3</b><span>Purpose-built experiences</span></div>
      </section>

      <section aria-label="Evidence pipeline">
        <div class="section-head">
          <div><div class="eyebrow">The working path</div><h2>Five moves. One evidence trail.</h2></div>
          <p>The raw transcript stays local. Only validated chunks are written to the Elasticsearch alias, and every answer retains its episode, URL, and timestamp.</p>
        </div>
        <div class="pipeline">
          <article class="stage sources"><span class="number">01 · COLLECT</span><h3>Sources</h3><p>Private and public evidence enter separate lanes.</p><ul><li>DAMA LA <span>6 episodes</span></li><li>Agentic Mesh <span id="mesh-state">19 ready</span></li><li>Guest profile <span>PDF / TXT</span></li><li>Industry web <span>public</span></li></ul></article>
          <div class="connector" aria-hidden="true">→</div>
          <article class="stage shape"><span class="number">02 · SHAPE</span><h3>Provenance</h3><p>Normalize without losing the source.</p><ul><li>Timestamped chunks</li><li>Episode metadata</li><li>Deterministic IDs</li><li>Approval-bound writes</li></ul></article>
          <div class="connector" aria-hidden="true">→</div>
          <article class="stage search"><span class="number">03 · RETRIEVE</span><h3>Elasticsearch</h3><p>Exact language and semantic meaning are fused.</p><ul><li>BM25 + semantic_text</li><li>RRF hybrid ranking</li><li>Metadata filters</li><li><code>great-questions-memories</code></li></ul></article>
          <div class="connector" aria-hidden="true">→</div>
          <article class="stage agents"><span class="number">04 · REASON</span><h3>Mastra</h3><p>Supervisors delegate to narrow specialists.</p><ul><li>Podcast retrieval tool</li><li>Industry research agent</li><li>Model fallback</li><li>Persistent traces</li></ul></article>
          <div class="connector" aria-hidden="true">→</div>
          <article class="stage experience"><span class="number">05 · EXPLAIN</span><h3>Experiences</h3><p>Different jobs share the same evidence.</p><ul><li>Research memory</li><li>Podcast prep</li><li>Evolution story</li><li>Mastra Studio</li></ul></article>
        </div>

        <div class="memory-model">
          <article class="model-card active"><small>Live now</small><h3>Transcript memory</h3><p>Timestamped episode chunks are searchable through the memory alias. Answers link back to the recording.</p></article>
          <article class="model-card future"><small>Deliberate next layer</small><h3>Relations + decisions</h3><p id="future-copy">The indexes exist, but remain empty until claims and changes can be adjudicated without inventing certainty.</p></article>
        </div>
      </section>

      <section class="agent-map" aria-label="Mastra agent roles">
        <div class="section-head"><div><div class="eyebrow">Agent team</div><h2>Each agent has one job.</h2></div></div>
        <div class="agent-rail">
          <div class="agent"><b>Great Questions</b><span>Retrieves your history, separates viewpoints, and detects supported change.</span></div>
          <div class="agent"><b>Podcast Prep</b><span>Combines guest research with your sourced point of view.</span></div>
          <div class="agent"><b>Industry Research</b><span>Searches current public sources with citations and uncertainty.</span></div>
          <div class="agent"><b>Mesh Ingestion</b><span>Validates 19 episodes and writes only an explicitly approved plan.</span></div>
        </div>
      </section>

      <section class="rails" aria-label="Supporting architecture">
        <article class="rail"><small>Models</small><h3>OpenRouter → Novita</h3><p>Claude Haiku is primary. GLM-5.3 is the automatic fallback for conversational agents.</p></article>
        <article class="rail"><small>Continuity</small><h3>LibSQL + notebooks</h3><p>Threads, saved result sets, prep workspaces, and local Mastra traces persist between turns.</p></article>
        <article class="rail"><small>Trust</small><h3>Receipts before certainty</h3><p>Speaker ambiguity stays visible. Writes are alias-bound. Private transcripts are excluded from Git.</p></article>
      </section>

      <footer>Great Questions AI · Mastra orchestration · Elasticsearch evidence memory</footer>
    </main>
    <script>
      fetch("/great-questions/api/status").then(function (response) {
        if (!response.ok) throw new Error("status");
        return response.json();
      }).then(function (data) {
        var meshLoaded = Number(data.memories) >= 579;
        document.getElementById("memory-count").textContent = String(data.memories);
        document.getElementById("corpus-state").textContent = meshLoaded ? "25 podcast episodes searchable" : "6 live · 19 ingestion-ready";
        document.getElementById("mesh-state").textContent = meshLoaded ? "19 searchable" : "19 ready";
        document.getElementById("live").textContent = "Elasticsearch connected · " + data.memories + " memories";
        document.getElementById("future-copy").textContent = data.relations + " relations · " + data.decisions + " decisions. Structured evolution remains evidence-gated.";
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
