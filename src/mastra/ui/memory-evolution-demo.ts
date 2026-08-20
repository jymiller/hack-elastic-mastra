import {
  createDamaLaPodcastQrSvg,
  damaLaPodcastUrl,
} from "../../lib/dama-la.js";
import {
  appHeaderCss,
  renderAppHeader,
} from "./app-navigation.js";

const damaLaQrSvg = await createDamaLaPodcastQrSvg();

export const memoryEvolutionDemoPage = String.raw`<!doctype html>
<html lang="en" data-window="all">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="An interactive view of how the Great Questions memory thesis evolved." />
    <title>Living Memory · Great Questions AI</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #060908;
        --ink: #f7f4ec;
        --soft: #999d96;
        --line: rgba(247,244,236,.12);
        --mint: #5dffa1;
        --violet: #c787ff;
        --amber: #ffc557;
        --blue: #55d6ff;
      }
      * { box-sizing: border-box; }
      html, body { margin: 0; min-height: 100%; }
      body {
        color: var(--ink); background:
          radial-gradient(circle at 15% 35%, rgba(93,255,161,.10), transparent 30rem),
          radial-gradient(circle at 77% 25%, rgba(199,135,255,.11), transparent 34rem),
          var(--bg);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      a { color: inherit; }
      button { font: inherit; }
      header {
        height: 54px; padding: 0 clamp(20px, 3.8vw, 58px); display: flex; align-items: center;
        justify-content: space-between; gap: 24px; border-bottom: 1px solid var(--line);
        background: rgba(6,9,8,.78); backdrop-filter: blur(18px);
      }
      .brand { display: flex; align-items: center; gap: 11px; }
      .mark { width: 34px; height: 34px; display: grid; place-items: center; border: 1px solid rgba(93,255,161,.45); border-radius: 50%; color: var(--mint); font: 15px Georgia, serif; }
      .brand strong, .brand span { display: block; }
      .brand strong { font-size: 12px; }
      .brand span { color: var(--soft); font-size: 8px; letter-spacing: .11em; text-transform: uppercase; }
      ${appHeaderCss}
      main { width: min(1510px, 100%); margin: auto; padding: 19px clamp(20px, 3.8vw, 58px) 18px; }
      .intro { display: flex; align-items: end; justify-content: space-between; gap: 34px; }
      .eyebrow { color: var(--mint); font-size: 8px; font-weight: 800; letter-spacing: .2em; text-transform: uppercase; }
      h1 { margin: 5px 0 0; font: 400 clamp(38px, 4.7vw, 68px)/.93 Georgia, serif; letter-spacing: -.05em; }
      .live { display: flex; align-items: center; gap: 8px; padding-bottom: 6px; color: var(--soft); font: 9px ui-monospace, SFMono-Regular, Menlo, monospace; }
      .live i { width: 7px; height: 7px; border-radius: 50%; background: var(--mint); box-shadow: 0 0 13px var(--mint); }
      .theater { display: grid; grid-template-columns: 220px minmax(520px, 1fr) 240px; gap: 28px; margin-top: 16px; min-height: 465px; }
      .arc { position: relative; padding: 15px 0 8px 22px; }
      .arc::before { content: ""; position: absolute; left: 4px; top: 23px; bottom: 25px; width: 1px; background: linear-gradient(var(--amber), var(--mint), var(--violet)); box-shadow: 0 0 14px rgba(93,255,161,.42); }
      .era { position: relative; padding: 11px 0 22px 14px; }
      .era::before { content: ""; position: absolute; left: -21px; top: 17px; width: 9px; height: 9px; border-radius: 50%; background: var(--tone); box-shadow: 0 0 15px var(--tone); }
      .era.then { --tone: var(--amber); }
      .era.now { --tone: var(--violet); margin-top: 70px; }
      .era small { color: var(--tone); font-size: 8px; font-weight: 800; letter-spacing: .17em; text-transform: uppercase; }
      .era h2 { margin: 9px 0 8px; font: 400 27px/1.02 Georgia, serif; letter-spacing: -.035em; }
      .era p { margin: 0; color: var(--soft); font-size: 10px; line-height: 1.55; }
      .era a { display: inline-block; margin-top: 11px; color: var(--tone); font-size: 8px; letter-spacing: .08em; text-decoration: none; text-transform: uppercase; }
      .network { position: relative; min-width: 0; border-left: 1px solid var(--line); border-right: 1px solid var(--line); overflow: hidden; }
      .network::before { content: ""; position: absolute; inset: 0; pointer-events: none; background-image: radial-gradient(rgba(247,244,236,.14) .7px, transparent .7px); background-size: 18px 18px; mask-image: radial-gradient(circle at 52% 50%, #000, transparent 72%); }
      .network svg { position: relative; display: block; width: 100%; height: 465px; }
      .edge { fill: none; stroke: rgba(247,244,236,.16); stroke-width: 1.4; }
      .edge.primary { stroke: url(#memoryGradient); stroke-width: 2.2; filter: url(#glow); }
      .flow-dot { fill: var(--mint); filter: url(#glow); }
      .memory-node { cursor: pointer; outline: none; transition: opacity 220ms ease, filter 220ms ease; }
      .memory-node:focus .node-ring, .memory-node:hover .node-ring { stroke-width: 2.6; filter: url(#glow); }
      .node-ring { fill: rgba(6,9,8,.92); stroke: var(--tone); stroke-width: 1.4; transition: stroke-width 150ms ease; }
      .node-core { fill: var(--tone); opacity: .12; }
      .node-kicker { fill: var(--tone); font: 700 8px Inter, sans-serif; letter-spacing: 1.2px; text-anchor: middle; }
      .node-label { fill: var(--ink); font: 400 13px Georgia, serif; text-anchor: middle; }
      .context { --tone: var(--amber); }
      .persistent { --tone: var(--mint); }
      .episodic { --tone: var(--blue); }
      .decay { --tone: var(--violet); }
      .evidence { --tone: var(--mint); }
      .receipt { --tone: var(--amber); }
      .uncertain { --tone: var(--blue); }
      .relation { --tone: var(--violet); }
      html[data-window="180"] .memory-node[data-age="old"] { opacity: .22; filter: grayscale(.8); }
      html[data-window="21"] .memory-node[data-age="old"], html[data-window="21"] .memory-node[data-age="long"] { opacity: .13; filter: grayscale(.9); }
      html[data-window="21"] .edge:not(.recent) { opacity: .18; }
      .lens { display: flex; flex-direction: column; padding: 13px 0 7px; }
      .lens-label { color: var(--soft); font-size: 8px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; }
      .lens-controls { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; margin-top: 10px; }
      .lens-controls button { padding: 7px 3px; border: 1px solid var(--line); border-radius: 8px; color: var(--soft); background: transparent; font-size: 8px; cursor: pointer; }
      .lens-controls button[aria-pressed="true"] { color: var(--bg); border-color: var(--mint); background: var(--mint); }
      .detail { min-height: 160px; margin-top: 18px; padding-top: 17px; border-top: 1px solid var(--line); }
      .detail-meta { color: var(--violet); font-size: 8px; letter-spacing: .13em; text-transform: uppercase; }
      .detail h3 { margin: 8px 0; font: 400 26px/1 Georgia, serif; }
      .detail p { margin: 0; color: var(--soft); font-size: 10px; line-height: 1.55; }
      .detail-source { display: block; margin-top: 12px; color: var(--amber); font-size: 8px; }
      .qr-row { display: grid; grid-template-columns: 1fr 112px; gap: 12px; align-items: center; margin-top: auto; padding-top: 18px; border-top: 1px solid var(--line); }
      .qr-copy strong { display: block; color: var(--mint); font: 400 19px/1 Georgia, serif; }
      .qr-copy span { display: block; margin-top: 7px; color: var(--soft); font-size: 8px; line-height: 1.4; }
      .qr { display: block; padding: 6px; border-radius: 8px; background: #fff; }
      .qr svg { display: block; width: 100%; height: auto; }
      .proof { display: grid; grid-template-columns: auto 1fr auto 1fr auto; gap: 13px; align-items: center; margin-top: 13px; padding-top: 12px; border-top: 1px solid var(--line); }
      .proof b { color: var(--ink); font: 400 15px Georgia, serif; }
      .proof span { color: var(--soft); font-size: 8px; }
      .proof-line { height: 1px; background: linear-gradient(90deg, var(--amber), var(--mint), var(--violet)); }
      @media (max-width: 1050px) {
        .theater { grid-template-columns: 180px minmax(460px, 1fr) 210px; gap: 18px; }
        .network svg { height: 450px; }
      }
      @media (max-width: 820px) {
        header { height: auto; min-height: 54px; }
        .theater { grid-template-columns: 1fr; }
        .arc { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding-left: 0; }
        .arc::before, .era::before { display: none; }
        .era.now { margin-top: 0; }
        .network { border: 1px solid var(--line); }
        .lens { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .qr-row { margin-top: 18px; }
      }
      @media (max-width: 560px) {
        .intro { display: block; }
        .live { margin-top: 10px; }
        .arc, .lens { grid-template-columns: 1fr; }
        .network svg { height: 370px; }
        .proof { grid-template-columns: 1fr; }
        .proof-line { width: 1px; height: 18px; }
      }
    </style>
  </head>
  <body>
    ${renderAppHeader("demo")}
    <main>
      <section class="intro">
        <div><div class="eyebrow">One idea · a living record</div><h1>Memory is not a file. It’s a point of view in motion.</h1></div>
        <div class="live"><i></i><span id="live-copy">Loading the evidence graph…</span></div>
      </section>

      <section class="theater">
        <aside class="arc" aria-label="John's memory thesis over time">
          <article class="era then"><small>Then · Apr 2026</small><h2>Memory as context</h2><p>Give the model material so a conversation can remember what the user supplied.</p><a href="https://www.youtube.com/watch?v=bqrQVYkKuN0&t=1891s" target="_blank" rel="noreferrer">Podcast receipt · 31:31 ↗</a></article>
          <article class="era now"><small>Now · working thesis</small><h2>Memory as evidence</h2><p>Keep dated beliefs, disagreement, uncertainty, and source receipts. Extend the record—never erase it.</p><a href="/great-questions">Open the living memory ↗</a></article>
        </aside>

        <div class="network" aria-label="Interactive memory evolution graph">
          <svg viewBox="0 0 780 465" role="img" aria-labelledby="network-title network-description">
            <title id="network-title">Memory evolution graph</title>
            <desc id="network-description">A connected path from context through persistent, episodic and time-decayed memory to an evidence graph, with source, uncertainty and relation branches.</desc>
            <defs>
              <linearGradient id="memoryGradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffc557"/><stop offset=".42" stop-color="#5dffa1"/><stop offset=".72" stop-color="#c787ff"/><stop offset="1" stop-color="#55d6ff"/></linearGradient>
              <filter id="glow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              <path id="spine" d="M116 116 C205 90 225 183 302 182 S382 94 449 116 S518 208 575 207 S630 300 654 331"/>
            </defs>
            <path class="edge primary" d="M116 116 C205 90 225 183 302 182 S382 94 449 116 S518 208 575 207 S630 300 654 331"/>
            <path class="edge" d="M302 182 C258 250 224 285 191 340"/>
            <path class="edge recent" d="M449 116 C421 222 398 296 354 354"/>
            <path class="edge recent" d="M575 207 C560 274 526 334 494 374"/>
            <path class="edge recent" d="M191 340 C336 425 500 414 654 331"/>
            <circle class="flow-dot" r="3"><animateMotion dur="4.4s" repeatCount="indefinite"><mpath href="#spine"/></animateMotion></circle>
            <circle class="flow-dot" r="2" opacity=".65"><animateMotion dur="4.4s" begin="-2.2s" repeatCount="indefinite"><mpath href="#spine"/></animateMotion></circle>

            <g class="memory-node context" data-id="context" data-age="old" role="button" tabindex="0" transform="translate(116 116)"><circle class="node-ring" r="46"/><circle class="node-core" r="36"/><text class="node-kicker" y="-4">2026</text><text class="node-label" y="15">Context</text></g>
            <g class="memory-node persistent" data-id="persistent" data-age="long" role="button" tabindex="0" transform="translate(302 182)"><circle class="node-ring" r="43"/><circle class="node-core" r="33"/><text class="node-kicker" y="-4">STORE</text><text class="node-label" y="15">Persistent</text></g>
            <g class="memory-node episodic" data-id="episodic" data-age="recent" role="button" tabindex="0" transform="translate(449 116)"><circle class="node-ring" r="45"/><circle class="node-core" r="35"/><text class="node-kicker" y="-4">TIME</text><text class="node-label" y="15">Episodic</text></g>
            <g class="memory-node decay" data-id="decay" data-age="recent" role="button" tabindex="0" transform="translate(575 207)"><circle class="node-ring" r="47"/><circle class="node-core" r="37"/><text class="node-kicker" y="-4">WEIGHT</text><text class="node-label" y="15">Time decay</text></g>
            <g class="memory-node evidence" data-id="evidence" data-age="current" role="button" tabindex="0" transform="translate(654 331)"><circle class="node-ring" r="56"/><circle class="node-core" r="45"/><text class="node-kicker" y="-7">NOW</text><text class="node-label" y="12">Evidence</text><text class="node-label" y="28">graph</text></g>
            <g class="memory-node receipt" data-id="receipt" data-age="long" role="button" tabindex="0" transform="translate(191 340)"><circle class="node-ring" r="35"/><circle class="node-core" r="27"/><text class="node-kicker" y="-3">PROOF</text><text class="node-label" y="14">Sources</text></g>
            <g class="memory-node uncertain" data-id="uncertain" data-age="recent" role="button" tabindex="0" transform="translate(354 354)"><circle class="node-ring" r="37"/><circle class="node-core" r="29"/><text class="node-kicker" y="-3">HONESTY</text><text class="node-label" y="14">Uncertainty</text></g>
            <g class="memory-node relation" data-id="relation" data-age="current" role="button" tabindex="0" transform="translate(494 374)"><circle class="node-ring" r="36"/><circle class="node-core" r="28"/><text class="node-kicker" y="-3">CHANGE</text><text class="node-label" y="14">Relations</text></g>
          </svg>
        </div>

        <aside class="lens">
          <div><div class="lens-label">Retrieval lens</div><div class="lens-controls" aria-label="Memory time window"><button type="button" data-window="all" aria-pressed="true">All</button><button type="button" data-window="180" aria-pressed="false">180d</button><button type="button" data-window="21" aria-pressed="false">21d</button></div></div>
          <div class="detail" aria-live="polite"><div class="detail-meta" id="detail-meta">Current thesis</div><h3 id="detail-title">Evidence graph</h3><p id="detail-copy">The answer includes the claim, its dated source, attribution confidence, and the path showing how the idea changed.</p><span class="detail-source" id="detail-source">Great Questions · live system</span></div>
          <div class="qr-row"><div class="qr-copy"><strong>Watch the source.</strong><span>Scan for the DAMA LA Podcast.</span></div><a class="qr" href="${damaLaPodcastUrl}" target="_blank" rel="noreferrer" aria-label="Open the DAMA LA Podcast playlist">${damaLaQrSvg}</a></div>
        </aside>
      </section>

      <footer class="proof"><b>Context</b><div class="proof-line"></div><b>Continuity</b><div class="proof-line"></div><b>Evidence that changes over time</b></footer>
    </main>
    <script>
      (function () {
        var details = {
          context: ["Earlier position", "Memory as context", "The model remembers material placed into the conversation window.", "DAMA LA · Apr 2026 · 31:31"],
          persistent: ["Long-term memory", "Persistent", "Elasticsearch keeps memories available beyond a single agent turn or thread.", "Elastic memory path"],
          episodic: ["Tonight's provocation", "Episodic", "When an event happened becomes part of retrieval—not just what the event said.", "Elastic hack night · presentation"],
          decay: ["Retrieval policy", "Time decay", "Changing the time window changes which memories shape the agent's behavior.", "Elastic hack night · 180d versus 21d"],
          evidence: ["Current thesis", "Evidence graph", "The answer includes the claim, its dated source, attribution confidence, and the path showing how the idea changed.", "Great Questions · live system"],
          receipt: ["Grounding", "Source receipts", "Every important claim should link back to an episode, timestamp, or research source.", "YouTube · timestamped evidence"],
          uncertain: ["Epistemic honesty", "Uncertainty", "Auto-captions are not diarized, so likely attribution must stay visibly uncertain.", "Retrieval metadata"],
          relation: ["Evolution", "Relations", "Changed, reinforced, contradicted, or superseded: new thinking extends the record instead of overwriting it.", "Great Questions memory model"]
        };
        function showDetail(id) {
          var detail = details[id];
          if (!detail) return;
          document.getElementById("detail-meta").textContent = detail[0];
          document.getElementById("detail-title").textContent = detail[1];
          document.getElementById("detail-copy").textContent = detail[2];
          document.getElementById("detail-source").textContent = detail[3];
        }
        document.querySelectorAll(".memory-node").forEach(function (node) {
          node.addEventListener("click", function () { showDetail(node.getAttribute("data-id")); });
          node.addEventListener("keydown", function (event) { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); showDetail(node.getAttribute("data-id")); } });
        });
        document.querySelectorAll("[data-window]").forEach(function (button) {
          if (!button.matches("button")) return;
          button.addEventListener("click", function () {
            var value = button.getAttribute("data-window") || "all";
            document.documentElement.setAttribute("data-window", value);
            document.querySelectorAll(".lens-controls button").forEach(function (candidate) { candidate.setAttribute("aria-pressed", String(candidate === button)); });
            if (value === "21") showDetail("decay");
            else if (value === "180") showDetail("episodic");
            else showDetail("evidence");
          });
        });
        fetch("/great-questions/api/status").then(function (response) { if (!response.ok) throw new Error("status"); return response.json(); }).then(function (data) {
          document.getElementById("live-copy").textContent = data.memories + " memories · " + data.relations + " relations · " + data.decisions + " decisions";
        }).catch(function () { document.getElementById("live-copy").textContent = "Living evidence system"; });
      })();
    </script>
  </body>
</html>`;
