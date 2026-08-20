import {
  createDamaLaPodcastQrSvg,
  damaLaPodcastUrl,
} from "../../lib/dama-la.js";
import {
  guestMemoryPrompts,
  industryComparisons,
  memoryStoryChapters,
  memoryStoryThumbnailUrl,
  nextMemoryQuestions,
  timestampedMemoryStoryUrl,
  type MemoryStoryChapter,
  type MemoryStoryReceipt,
} from "../../lib/memory-story.js";
import {
  appHeaderCss,
  renderAppHeader,
} from "./app-navigation.js";

const damaLaQrSvg = await createDamaLaPodcastQrSvg();

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderReceipt(receipt: MemoryStoryReceipt): string {
  const timestampedUrl = timestampedMemoryStoryUrl(receipt);
  const minute = Math.floor(receipt.seconds / 60);
  const second = String(receipt.seconds % 60).padStart(2, "0");

  return `<article class="receipt">
    <a class="receipt-image" href="${escapeHtml(timestampedUrl)}" target="_blank" rel="noreferrer" aria-label="Watch ${escapeHtml(receipt.title)} at ${minute}:${second}">
      <img src="${escapeHtml(memoryStoryThumbnailUrl(receipt.videoId))}" alt="Thumbnail for ${escapeHtml(receipt.title)}" loading="lazy" />
      <span class="play">▶</span><span class="time">${minute}:${second}</span>
    </a>
    <div class="receipt-body">
      <div class="receipt-meta">${escapeHtml(receipt.episode)} · ${escapeHtml(receipt.date)}</div>
      <h3>${escapeHtml(receipt.title)}</h3>
      <p>${escapeHtml(receipt.note)}</p>
      <div class="receipt-actions"><a href="${escapeHtml(timestampedUrl)}" target="_blank" rel="noreferrer">Open the evidence <span>↗</span></a><details><summary>Indexed receipt</summary><code>${escapeHtml(receipt.id)}</code></details></div>
    </div>
  </article>`;
}

function renderChapter(chapter: MemoryStoryChapter): string {
  return `<article class="chapter" id="${escapeHtml(chapter.id)}" data-chapter="${escapeHtml(chapter.id)}" data-accent="${chapter.accent}">
    <div class="chapter-number"><span>${escapeHtml(chapter.index)}</span><i></i></div>
    <div class="chapter-copy">
      <div class="chapter-period">${escapeHtml(chapter.period)}</div>
      <h2>${escapeHtml(chapter.title)}</h2>
      <p class="chapter-summary">${escapeHtml(chapter.summary)}</p>
      <div class="change"><span>What changed</span><p>${escapeHtml(chapter.changed)}</p></div>
      <div class="next"><span>Question it creates</span><p>${escapeHtml(chapter.question)}</p></div>
    </div>
    <div class="receipts">${chapter.receipts.map(renderReceipt).join("")}</div>
  </article>`;
}

const receiptCount = memoryStoryChapters.reduce(
  (count, chapter) => count + chapter.receipts.length,
  0,
);

export const memoryEvolutionDemoPage = String.raw`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="A sourced, click-through narrative of how John Miller's view of agent memory evolved across the Agentic Mesh podcast." />
    <title>The Memory Story · Great Questions AI</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #070a09;
        --panel: #0d1210;
        --panel-2: #111714;
        --ink: #f5f3ec;
        --soft: #a3aaa3;
        --faint: #737a74;
        --line: rgba(245,243,236,.11);
        --mint: #62f7a8;
        --violet: #c98aff;
        --amber: #ffc766;
        --blue: #62d8ff;
      }
      * { box-sizing: border-box; }
      html { scroll-behavior: smooth; scroll-padding-top: 100px; }
      html, body { margin: 0; min-height: 100%; }
      body {
        color: var(--ink);
        background:
          radial-gradient(circle at 8% 16%, rgba(98,247,168,.08), transparent 28rem),
          radial-gradient(circle at 88% 30%, rgba(201,138,255,.07), transparent 32rem),
          var(--bg);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      a { color: inherit; }
      ${appHeaderCss}
      main { width: min(1320px, 100%); margin: 0 auto; padding: 0 clamp(22px, 5vw, 72px) 80px; }
      .hero { padding: clamp(68px, 9vw, 120px) 0 44px; border-bottom: 1px solid var(--line); }
      .eyebrow { color: var(--mint); font: 800 11px/1 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .18em; text-transform: uppercase; }
      h1 { max-width: 1050px; margin: 22px 0 0; font: 400 clamp(52px, 7.2vw, 104px)/.91 Georgia, "Times New Roman", serif; letter-spacing: -.058em; }
      .hero-intro { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(260px, .75fr); gap: 70px; align-items: end; margin-top: 46px; }
      .dek { max-width: 760px; margin: 0; color: #c5cbc5; font-size: clamp(17px, 1.7vw, 24px); line-height: 1.55; letter-spacing: -.015em; }
      .provenance { padding-left: 20px; border-left: 1px solid var(--amber); }
      .provenance strong { display: block; color: var(--amber); font: 800 10px/1 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .14em; text-transform: uppercase; }
      .provenance p { margin: 11px 0 0; color: var(--soft); font-size: 13px; line-height: 1.55; }
      .hero-stats { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 28px; }
      .hero-stats span { padding: 9px 12px; border: 1px solid var(--line); border-radius: 999px; color: var(--soft); font: 700 10px/1 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .06em; text-transform: uppercase; }
      .hero-stats i { display: inline-block; width: 6px; height: 6px; margin-right: 7px; border-radius: 50%; background: var(--mint); box-shadow: 0 0 10px var(--mint); }
      .framing { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 30px 0 0; }
      .frame { min-height: 210px; padding: 28px; border: 1px solid var(--line); border-radius: 18px; background: rgba(13,18,16,.62); }
      .frame b { display: block; color: var(--tone); font: 800 10px/1 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .15em; text-transform: uppercase; }
      .frame h2 { margin: 34px 0 12px; font: 400 31px/1.04 Georgia, serif; letter-spacing: -.035em; }
      .frame p { margin: 0; color: var(--soft); font-size: 14px; line-height: 1.55; }
      .frame.then { --tone: var(--amber); }
      .frame.changed { --tone: var(--blue); }
      .frame.next-frame { --tone: var(--violet); }
      .story-index { position: sticky; top: 0; z-index: 5; display: flex; gap: 6px; margin: 0 calc(clamp(22px, 5vw, 72px) * -1); padding: 13px clamp(22px, 5vw, 72px); overflow-x: auto; border-bottom: 1px solid var(--line); background: rgba(7,10,9,.9); backdrop-filter: blur(18px); scrollbar-width: none; }
      .story-index::-webkit-scrollbar { display: none; }
      .story-index a { flex: 0 0 auto; padding: 9px 12px; border: 1px solid transparent; border-radius: 999px; color: var(--faint); font-size: 11px; text-decoration: none; transition: 160ms ease; }
      .story-index a:hover, .story-index a.active { color: var(--ink); border-color: var(--line); background: var(--panel-2); }
      .story-index a.active { color: var(--mint); }
      .story { padding-top: 44px; }
      .section-kicker { color: var(--mint); font: 800 10px/1 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .17em; text-transform: uppercase; }
      .story-title { max-width: 720px; margin: 16px 0 60px; font: 400 clamp(36px, 4vw, 58px)/1 Georgia, serif; letter-spacing: -.04em; }
      .chapter { --tone: var(--mint); display: grid; grid-template-columns: 74px minmax(280px, .78fr) minmax(430px, 1.22fr); gap: clamp(24px, 4vw, 58px); padding: 62px 0 76px; border-top: 1px solid var(--line); scroll-margin-top: 70px; }
      .chapter[data-accent="amber"] { --tone: var(--amber); }
      .chapter[data-accent="blue"] { --tone: var(--blue); }
      .chapter[data-accent="violet"] { --tone: var(--violet); }
      .chapter-number { display: flex; flex-direction: column; align-items: center; gap: 15px; color: var(--tone); font: 700 13px ui-monospace, SFMono-Regular, Menlo, monospace; }
      .chapter-number span { display: grid; width: 50px; height: 50px; place-items: center; border: 1px solid color-mix(in srgb, var(--tone) 45%, transparent); border-radius: 50%; box-shadow: inset 0 0 18px color-mix(in srgb, var(--tone) 9%, transparent); }
      .chapter-number i { width: 1px; flex: 1; min-height: 90px; background: linear-gradient(var(--tone), transparent); opacity: .42; }
      .chapter-period { color: var(--tone); font: 800 10px/1 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .14em; text-transform: uppercase; }
      .chapter-copy h2 { max-width: 520px; margin: 15px 0 18px; font: 400 clamp(34px, 3.7vw, 55px)/.98 Georgia, serif; letter-spacing: -.04em; }
      .chapter-summary { margin: 0; color: #c2c8c2; font-size: 16px; line-height: 1.62; }
      .change, .next { margin-top: 28px; padding-top: 19px; border-top: 1px solid var(--line); }
      .change span, .next span { display: block; margin-bottom: 9px; color: var(--tone); font: 800 9px/1 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .14em; text-transform: uppercase; }
      .change p, .next p { margin: 0; font-size: 14px; line-height: 1.55; }
      .next p { color: var(--soft); }
      .receipts { display: grid; align-content: start; gap: 14px; }
      .receipt { display: grid; grid-template-columns: 178px 1fr; min-width: 0; overflow: hidden; border: 1px solid var(--line); border-radius: 16px; background: rgba(13,18,16,.76); transition: transform 160ms ease, border-color 160ms ease; }
      .receipt:hover { transform: translateY(-2px); border-color: color-mix(in srgb, var(--tone) 42%, transparent); }
      .receipt-image { position: relative; display: block; min-height: 178px; overflow: hidden; background: #030504; }
      .receipt-image::after { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, transparent 55%, rgba(13,18,16,.72)); }
      .receipt-image img { width: 100%; height: 100%; object-fit: cover; opacity: .77; filter: saturate(.78) contrast(1.05); transition: transform 220ms ease, opacity 220ms ease; }
      .receipt:hover img { transform: scale(1.035); opacity: .95; }
      .play { position: absolute; z-index: 1; left: 16px; bottom: 16px; display: grid; width: 36px; height: 36px; place-items: center; border: 1px solid rgba(255,255,255,.38); border-radius: 50%; background: rgba(7,10,9,.78); color: var(--tone); font-size: 11px; }
      .time { position: absolute; z-index: 1; right: 10px; bottom: 10px; padding: 6px 7px; border-radius: 6px; background: rgba(7,10,9,.88); font: 700 9px ui-monospace, SFMono-Regular, Menlo, monospace; }
      .receipt-body { min-width: 0; padding: 19px 20px 17px; }
      .receipt-meta { color: var(--tone); font: 700 9px/1.35 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .08em; text-transform: uppercase; }
      .receipt h3 { margin: 10px 0 8px; font: 400 23px/1.08 Georgia, serif; letter-spacing: -.025em; }
      .receipt p { margin: 0; color: var(--soft); font-size: 12px; line-height: 1.5; }
      .receipt-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 16px; margin-top: 15px; }
      .receipt-actions > a { color: var(--tone); font: 800 9px ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .08em; text-decoration: none; text-transform: uppercase; }
      details { position: relative; color: var(--faint); font: 700 9px ui-monospace, SFMono-Regular, Menlo, monospace; }
      summary { cursor: pointer; }
      details code { display: block; max-width: 300px; margin-top: 8px; overflow: hidden; color: var(--soft); font-size: 8px; text-overflow: ellipsis; white-space: nowrap; }
      .throughline { display: grid; grid-template-columns: .72fr 1.28fr; gap: 80px; margin: 12px 0 90px; padding: clamp(34px, 5vw, 66px); border: 1px solid rgba(98,247,168,.2); border-radius: 24px; background: linear-gradient(135deg, rgba(98,247,168,.09), rgba(201,138,255,.045)); }
      .throughline h2 { margin: 14px 0 0; font: 400 clamp(36px, 4vw, 58px)/.98 Georgia, serif; letter-spacing: -.04em; }
      .throughline blockquote { margin: 0; font: 400 clamp(22px, 2.4vw, 34px)/1.35 Georgia, serif; letter-spacing: -.025em; }
      .throughline blockquote span { color: var(--mint); }
      .comparison { padding: 80px 0; border-top: 1px solid var(--line); }
      .comparison-head { display: grid; grid-template-columns: .85fr 1.15fr; gap: 80px; align-items: end; }
      .comparison h2, .questions h2 { margin: 15px 0 0; font: 400 clamp(42px, 5.2vw, 72px)/.95 Georgia, serif; letter-spacing: -.045em; }
      .comparison-head > p { margin: 0; color: var(--soft); font-size: 16px; line-height: 1.6; }
      .comparison-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 48px; }
      .comparison-card { min-height: 310px; display: flex; flex-direction: column; padding: 28px; border: 1px solid var(--line); border-radius: 18px; background: var(--panel); }
      .comparison-card:nth-child(1) { --tone: var(--blue); }
      .comparison-card:nth-child(2) { --tone: var(--mint); }
      .comparison-card:nth-child(3) { --tone: var(--violet); }
      .comparison-card small { color: var(--tone); font: 800 9px/1 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .15em; text-transform: uppercase; }
      .comparison-card h3 { margin: 34px 0 14px; font: 400 30px/1.05 Georgia, serif; letter-spacing: -.03em; }
      .comparison-card p { margin: 0; color: var(--soft); font-size: 14px; line-height: 1.62; }
      .comparison-card a { margin-top: auto; padding-top: 24px; color: var(--tone); font: 700 9px/1.45 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .06em; text-decoration: none; text-transform: uppercase; }
      .questions { padding: 82px 0; border-top: 1px solid var(--line); }
      .question-layout { display: grid; grid-template-columns: .8fr 1.2fr; gap: 80px; margin-top: 52px; }
      .question-list { counter-reset: question; margin: 0; padding: 0; list-style: none; }
      .question-list li { counter-increment: question; position: relative; padding: 23px 0 23px 48px; border-top: 1px solid var(--line); font: 400 22px/1.35 Georgia, serif; }
      .question-list li::before { content: "0" counter(question); position: absolute; left: 0; top: 27px; color: var(--violet); font: 700 10px ui-monospace, SFMono-Regular, Menlo, monospace; }
      .guest-prompts { display: grid; gap: 10px; }
      .guest-prompts > div { padding: 22px 24px; border: 1px solid var(--line); border-radius: 14px; background: rgba(13,18,16,.7); }
      .guest-prompts b { display: block; margin-bottom: 10px; color: var(--amber); font: 800 9px ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .14em; text-transform: uppercase; }
      .guest-prompts p { margin: 0; color: #c4cac4; font-size: 14px; line-height: 1.55; }
      .publish { display: grid; grid-template-columns: 1fr 180px; gap: 46px; align-items: center; margin-top: 20px; padding: 38px; border: 1px solid var(--line); border-radius: 22px; background: var(--panel); }
      .publish h2 { margin: 12px 0 13px; font: 400 clamp(34px, 4vw, 54px)/1 Georgia, serif; letter-spacing: -.04em; }
      .publish p { max-width: 720px; margin: 0; color: var(--soft); font-size: 14px; line-height: 1.6; }
      .qr { display: block; padding: 10px; border-radius: 12px; background: white; }
      .qr svg { display: block; width: 100%; height: auto; }
      footer { display: flex; justify-content: space-between; gap: 24px; padding: 30px 0 0; color: var(--faint); font: 700 9px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .08em; text-transform: uppercase; }
      @media (max-width: 1040px) {
        .chapter { grid-template-columns: 58px minmax(240px, .8fr) minmax(360px, 1.2fr); gap: 24px; }
        .receipt { grid-template-columns: 138px 1fr; }
        .comparison-head, .question-layout, .throughline { gap: 42px; }
      }
      @media (max-width: 820px) {
        .hero-intro, .throughline, .comparison-head, .question-layout { grid-template-columns: 1fr; gap: 28px; }
        .framing, .comparison-grid { grid-template-columns: 1fr; }
        .frame { min-height: 0; }
        .frame h2 { margin-top: 24px; }
        .chapter { grid-template-columns: 44px 1fr; }
        .receipts { grid-column: 2; }
        .chapter-number span { width: 40px; height: 40px; }
        .publish { grid-template-columns: 1fr 140px; }
      }
      @media (max-width: 560px) {
        main { padding-inline: 18px; }
        .hero { padding-top: 48px; }
        h1 { font-size: 50px; }
        .story-index { margin-inline: -18px; padding-inline: 18px; }
        .story-title { margin-bottom: 34px; }
        .chapter { grid-template-columns: 1fr; padding: 46px 0 58px; }
        .chapter-number { flex-direction: row; justify-content: flex-start; }
        .chapter-number i { width: 80px; height: 1px; min-height: 0; flex: none; background: linear-gradient(90deg, var(--tone), transparent); }
        .receipts { grid-column: 1; }
        .receipt { grid-template-columns: 1fr; }
        .receipt-image { min-height: 190px; }
        .receipt-image::after { background: linear-gradient(0deg, rgba(13,18,16,.45), transparent 55%); }
        .throughline { padding: 28px; }
        .comparison, .questions { padding-block: 58px; }
        .publish { grid-template-columns: 1fr; padding: 26px; }
        .qr { width: 160px; }
        footer { display: block; }
        footer span { display: block; margin-top: 8px; }
      }
    </style>
  </head>
  <body>
    ${renderAppHeader("demo")}
    <main>
      <section class="hero">
        <div class="eyebrow">Hackathon output · John Miller’s memory thesis</div>
        <h1>What did I think?<br />What changed?<br />What comes next?</h1>
        <div class="hero-intro">
          <p class="dek">The publishable artifact produced by tonight’s research process: a click-through story of how one idea moved from context windows to a governed system of working, shared, episodic, and enterprise memory.</p>
          <aside class="provenance"><strong>Read this honestly</strong><p>This is an editorial synthesis of co-hosted discussions. Agentic Mesh auto-captions do not reliably identify whether John Miller or Eric Broda spoke each passage.</p></aside>
        </div>
        <div class="hero-stats"><span><i></i><span id="live-copy">579 evidence memories distilled</span></span><span>6 conceptual shifts</span><span>${receiptCount} timestamped receipts</span><span>No AI required to view</span></div>
        <div class="framing">
          <article class="frame then"><b>What did I think?</b><h2>Memory made agents stateful.</h2><p>It let long-running, distributed work survive pauses, failures, and handoffs.</p></article>
          <article class="frame changed"><b>What changed?</b><h2>Recall became governed context.</h2><p>Selection, policy, provenance, identity, and process recovery became part of the definition.</p></article>
          <article class="frame next-frame"><b>What comes next?</b><h2>Memory has to improve judgment.</h2><p>We still need consolidation, contradiction handling, intentional forgetting, and evidence that remembering helps.</p></article>
        </div>
      </section>

      <nav class="story-index" aria-label="Memory story chapters">
        ${memoryStoryChapters.map((chapter) => `<a href="#${escapeHtml(chapter.id)}" data-index="${escapeHtml(chapter.id)}">${escapeHtml(chapter.index)} · ${escapeHtml(chapter.title)}</a>`).join("")}
        <a href="#karpathy">07 · Compare with Karpathy</a><a href="#next">08 · Ask next</a>
      </nav>

      <section class="story">
        <div class="section-kicker">The evidence trail</div>
        <h2 class="story-title">Six shifts make the current point of view legible.</h2>
        ${memoryStoryChapters.map(renderChapter).join("")}
      </section>

      <section class="throughline">
        <div><div class="section-kicker">The throughline</div><h2>The idea grew outward.</h2></div>
        <blockquote>Memory started as the state required to keep an agent running. It became the <span>evidence, policy, identity, and experience</span> required to let a system of agents act with continuity—and remain accountable for it.</blockquote>
      </section>

      <section class="comparison" id="karpathy">
        <div class="comparison-head"><div><div class="section-kicker">Third-party research lane</div><h2>John × Karpathy</h2></div><p>Karpathy is useful here as a comparison lens, not an authority who grades the podcast. The overlap clarifies the foundation; the difference exposes the enterprise problem; the gap creates the next interview.</p></div>
        <div class="comparison-grid">
          ${industryComparisons.map((item) => `<article class="comparison-card"><small>${escapeHtml(item.label)}</small><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)}</p><a href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noreferrer">${escapeHtml(item.sourceLabel)} ↗</a></article>`).join("")}
        </div>
      </section>

      <section class="questions" id="next">
        <div class="section-kicker">What we need to solve next</div>
        <h2>The story should end with better questions.</h2>
        <div class="question-layout">
          <ol class="question-list">${nextMemoryQuestions.map((question) => `<li>${escapeHtml(question)}</li>`).join("")}</ol>
          <div class="guest-prompts">${guestMemoryPrompts.map((prompt) => `<div><b>${escapeHtml(prompt.label)}</b><p>${escapeHtml(prompt.text)}</p></div>`).join("")}</div>
        </div>
      </section>

      <section class="publish">
        <div><div class="section-kicker">The durable artifact</div><h2>Keep the story. Turn off the agent.</h2><p>This page is intentionally precomputed and source-linked. It remains useful after the live research agents are paused; the AI system is the editorial workshop used to refresh the narrative when new episodes arrive.</p></div>
        <a class="qr" href="${damaLaPodcastUrl}" target="_blank" rel="noreferrer" aria-label="Open the DAMA LA Podcast playlist">${damaLaQrSvg}</a>
      </section>

      <footer><b>Great Questions AI · A sourced point of view in motion</b><span>Podcast evidence · Industry comparison · Questions worth asking</span></footer>
    </main>
    <script>
      (function () {
        var indexLinks = Array.from(document.querySelectorAll("[data-index]"));
        var chapters = Array.from(document.querySelectorAll("[data-chapter]"));
        if ("IntersectionObserver" in window) {
          var observer = new IntersectionObserver(function (entries) {
            var visible = entries.filter(function (entry) { return entry.isIntersecting; }).sort(function (a, b) { return b.intersectionRatio - a.intersectionRatio; })[0];
            if (!visible) return;
            var id = visible.target.getAttribute("data-chapter");
            indexLinks.forEach(function (link) { link.classList.toggle("active", link.getAttribute("data-index") === id); });
          }, { rootMargin: "-20% 0px -58% 0px", threshold: [0, .2, .5] });
          chapters.forEach(function (chapter) { observer.observe(chapter); });
        }
      })();
    </script>
  </body>
</html>`;
