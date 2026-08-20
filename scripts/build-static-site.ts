import { copyFile, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { architecturePage } from "../src/mastra/ui/architecture-ui.js";
import { appHeaderCss } from "../src/mastra/ui/app-navigation.js";
import { memoryEvolutionDemoPage } from "../src/mastra/ui/memory-evolution-demo.js";

export type StaticPage = "architecture" | "how" | "story";

const devpostUrl = "https://devpost.com/software/great-questions-ai";
const videoUrl = "https://youtu.be/mRkD1FRksxg";

function navigationLink(
  href: string,
  label: string,
  page: StaticPage,
  activePage: StaticPage,
): string {
  const current = page === activePage ? ' aria-current="page"' : "";
  return `<a href="${href}"${current}>${label}</a>`;
}

export function renderStaticNavigation(activePage: StaticPage): string {
  return `<nav class="gq-nav" aria-label="Primary">
    ${navigationLink("/", "Memory story", "story", activePage)}
    ${navigationLink("/how-it-worked/", "How it worked", "how", activePage)}
    ${navigationLink("/architecture/", "Architecture", "architecture", activePage)}
    <a class="studio-link" href="${devpostUrl}" target="_blank" rel="noreferrer">Devpost ↗</a>
    <a class="studio-link" href="${videoUrl}" target="_blank" rel="noreferrer">Video ↗</a>
  </nav>`;
}

export function staticizePage(
  html: string,
  activePage: StaticPage,
): string {
  return html
    .replace(
      '<a class="gq-app-brand" href="/great-questions"',
      '<a class="gq-app-brand" href="/"',
    )
    .replace(
      /<nav class="gq-nav" aria-label="Primary">[\s\S]*?<\/nav>/,
      renderStaticNavigation(activePage),
    );
}

export function renderHowItWorkedPage(): string {
  return String.raw`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="How Great Questions AI used Elasticsearch and Mastra to turn podcast transcripts into a sourced memory story." />
    <title>How it worked · Great Questions AI</title>
    <style>
      :root { color-scheme: dark; --night: #080b0a; --panel: #101512; --ink: #f5f1e8; --soft: #a8afa9; --line: rgba(245,241,232,.12); --mint: #62f7a8; --amber: #ffc766; --violet: #c98aff; --blue: #62d8ff; --nav-tone: var(--mint); }
      * { box-sizing: border-box; }
      html, body { margin: 0; min-height: 100%; }
      body { color: var(--ink); background: radial-gradient(circle at 8% 4%, rgba(98,247,168,.09), transparent 30rem), radial-gradient(circle at 90% 20%, rgba(201,138,255,.08), transparent 34rem), var(--night); font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      a { color: inherit; }
      ${appHeaderCss}
      main { width: min(1260px, 100%); margin: auto; padding: clamp(58px, 8vw, 108px) clamp(20px, 5vw, 68px) 90px; }
      .eyebrow { color: var(--mint); font: 800 10px/1 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .18em; text-transform: uppercase; }
      h1 { max-width: 980px; margin: 20px 0 28px; font: 400 clamp(52px, 7vw, 94px)/.92 Georgia, serif; letter-spacing: -.055em; }
      .lede { max-width: 800px; margin: 0; color: #c7cdc7; font-size: clamp(17px, 1.8vw, 23px); line-height: 1.6; }
      .status { display: inline-flex; gap: 9px; align-items: center; margin-top: 28px; padding: 9px 12px; border: 1px solid rgba(98,247,168,.24); border-radius: 999px; color: var(--mint); font: 700 10px ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .06em; text-transform: uppercase; }
      .status i { width: 7px; height: 7px; border-radius: 50%; background: var(--mint); box-shadow: 0 0 14px var(--mint); }
      .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 54px 0 90px; }
      .stat { min-height: 116px; padding: 22px; border-top: 1px solid var(--tone); background: linear-gradient(180deg, color-mix(in srgb, var(--tone) 7%, transparent), transparent); }
      .stat:nth-child(1) { --tone: var(--amber); } .stat:nth-child(2) { --tone: var(--mint); } .stat:nth-child(3) { --tone: var(--violet); } .stat:nth-child(4) { --tone: var(--blue); }
      .stat b { display: block; color: var(--tone); font: 400 38px Georgia, serif; }
      .stat span { color: var(--soft); font-size: 10px; letter-spacing: .08em; text-transform: uppercase; }
      .flow { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 100px; }
      .step { min-height: 190px; padding: 22px; border: 1px solid var(--line); border-radius: 14px; background: rgba(16,21,18,.74); }
      .step small { color: var(--mint); font: 800 9px ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .12em; }
      .step h2 { margin: 28px 0 11px; font: 400 26px/1 Georgia, serif; }
      .step p { margin: 0; color: var(--soft); font-size: 12px; line-height: 1.55; }
      .showcase { display: grid; gap: 92px; }
      .showcase article { display: grid; grid-template-columns: .72fr 1.28fr; gap: clamp(34px, 6vw, 90px); align-items: center; }
      .showcase article:nth-child(even) { grid-template-columns: 1.28fr .72fr; }
      .showcase article:nth-child(even) .copy { order: 2; }
      .copy b { color: var(--tone); font: 800 9px ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .16em; text-transform: uppercase; }
      .copy h2 { margin: 15px 0 17px; font: 400 clamp(34px, 4vw, 58px)/.98 Georgia, serif; letter-spacing: -.04em; }
      .copy p { margin: 0; color: var(--soft); font-size: 15px; line-height: 1.65; }
      .research { --tone: var(--mint); } .prep { --tone: var(--violet); } .system { --tone: var(--blue); }
      .shot { overflow: hidden; border: 1px solid color-mix(in srgb, var(--tone) 38%, transparent); border-radius: 18px; background: var(--panel); box-shadow: 0 24px 80px rgba(0,0,0,.32); }
      .shot img { display: block; width: 100%; height: auto; }
      .final { margin-top: 100px; padding: 40px; border: 1px solid rgba(98,247,168,.24); border-radius: 22px; background: linear-gradient(135deg, rgba(98,247,168,.08), rgba(201,138,255,.05)); }
      .final h2 { margin: 12px 0 14px; font: 400 clamp(36px, 4.5vw, 62px)/1 Georgia, serif; letter-spacing: -.04em; }
      .final p { max-width: 760px; margin: 0; color: var(--soft); font-size: 15px; line-height: 1.65; }
      .actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 28px; }
      .actions a { padding: 11px 14px; border: 1px solid var(--line); border-radius: 999px; color: var(--mint); font-size: 11px; text-decoration: none; }
      footer { margin-top: 70px; padding-top: 24px; border-top: 1px solid var(--line); color: #737a74; font: 700 9px ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .08em; text-transform: uppercase; }
      @media (max-width: 900px) { .stats { grid-template-columns: repeat(2, 1fr); } .flow { grid-template-columns: 1fr; } .step { min-height: 0; } .showcase article, .showcase article:nth-child(even) { grid-template-columns: 1fr; } .showcase article:nth-child(even) .copy { order: initial; } }
      @media (max-width: 560px) { .stats { grid-template-columns: 1fr 1fr; } .stat { min-height: 94px; padding: 16px; } .final { padding: 27px; } }
    </style>
  </head>
  <body>
    <header class="gq-app-header"><a class="gq-app-brand" href="/"><span class="gq-app-mark">GQ</span><span><strong>Great Questions AI</strong><span>Evidence memory for better questions</span></span></a>${renderStaticNavigation("how")}</header>
    <main>
      <section>
        <div class="eyebrow">The completed hackathon process</div>
        <h1>The AI is off.<br />The receipts stay.</h1>
        <p class="lede">Great Questions AI used Elasticsearch and Mastra as an editorial workshop. The published result is now a static, source-linked story: no model calls, no database connection, and no running agent infrastructure.</p>
        <div class="status"><i></i>Static public edition · zero runtime AI</div>
      </section>
      <section class="stats" aria-label="Project totals">
        <div class="stat"><b>25</b><span>Podcast episodes</span></div><div class="stat"><b>579</b><span>Evidence memories</span></div><div class="stat"><b>4</b><span>Mastra agent roles</span></div><div class="stat"><b>10</b><span>Published receipts</span></div>
      </section>
      <section class="flow" aria-label="Research process">
        <article class="step"><small>01 · COLLECT</small><h2>Transcripts</h2><p>DAMA LA and Agentic Mesh episodes entered as local, timestamped source material.</p></article>
        <article class="step"><small>02 · SHAPE</small><h2>Provenance</h2><p>Deterministic chunks retained the episode, date, timestamp, and original URL.</p></article>
        <article class="step"><small>03 · RETRIEVE</small><h2>Elasticsearch</h2><p>BM25 and semantic retrieval were fused with RRF across 579 memories.</p></article>
        <article class="step"><small>04 · REASON</small><h2>Mastra</h2><p>Specialist agents separated viewpoints, researched comparisons, and exposed uncertainty.</p></article>
        <article class="step"><small>05 · PUBLISH</small><h2>Memory Story</h2><p>Manually reviewed evidence became a durable click-through narrative.</p></article>
      </section>
      <section class="showcase">
        <article class="research"><div class="copy"><b>Question-specific evidence</b><h2>The research workshop</h2><p>During the hackathon, every question triggered hybrid retrieval and kept its own Evidence Trail. Source cards opened the original YouTube episode at the exact timestamp. This screenshot documents that process; the public site makes no search or agent requests.</p></div><div class="shot"><img src="/assets/research-workshop.jpg" alt="The Great Questions research workshop with timestamped evidence" /></div></article>
        <article class="prep"><div class="copy"><b>Interview intelligence</b><h2>Podcast preparation</h2><p>A separate supervisor combined a guest profile, public research, and John's sourced point of view. It generated open questions, premise-bearing questions, and follow-ups while keeping evidence lanes distinct.</p></div><div class="shot"><img src="/assets/podcast-prep.jpg" alt="The Great Questions podcast preparation workspace" /></div></article>
        <article class="system"><div class="copy"><b>Explainable by design</b><h2>The system behind it</h2><p>Elasticsearch supplied attributable memory; Mastra supplied orchestration, specialists, traces, and evaluation. The architecture remains documented even though none of those services run in this static edition.</p></div><div class="shot"><img src="/assets/architecture.jpg" alt="The Great Questions AI solution architecture" /></div></article>
      </section>
      <section class="final"><div class="eyebrow">The durable output</div><h2>Keep the story. Turn off the agent.</h2><p>The final Memory Story carries ten timestamped receipts into the source episodes. It can remain public without API keys, Elasticsearch credentials, model spend, or a server process.</p><div class="actions"><a href="/">Read the Memory Story →</a><a href="${devpostUrl}" target="_blank" rel="noreferrer">View Devpost ↗</a><a href="${videoUrl}" target="_blank" rel="noreferrer">Watch the walkthrough ↗</a></div></section>
      <footer>Great Questions AI · Static public edition · Built with Elasticsearch and Mastra</footer>
    </main>
  </body>
</html>`;
}

export function assertStaticOutput(name: string, html: string): void {
  const forbidden = [
    /fetch\s*\(/,
    /XMLHttpRequest/,
    /WebSocket/,
    /\/api\//,
    /\/agents(?:\/|\")/,
    /OPENROUTER_API_KEY/,
    /ELASTIC_API_KEY/,
  ];

  for (const pattern of forbidden) {
    if (pattern.test(html)) {
      throw new Error(`${name} contains forbidden runtime capability: ${pattern}`);
    }
  }
}

export async function buildStaticSite(
  repositoryRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
  ),
): Promise<void> {
  const outputDirectory = path.join(repositoryRoot, "dist-static");
  const assetsDirectory = path.join(outputDirectory, "assets");
  const pages = {
    "index.html": staticizePage(memoryEvolutionDemoPage, "story"),
    "architecture/index.html": staticizePage(
      architecturePage,
      "architecture",
    ),
    "how-it-worked/index.html": renderHowItWorkedPage(),
  };

  for (const [name, html] of Object.entries(pages)) {
    assertStaticOutput(name, html);
  }

  await rm(outputDirectory, { force: true, recursive: true });
  await mkdir(assetsDirectory, { recursive: true });

  for (const [relativePath, html] of Object.entries(pages)) {
    const destination = path.join(outputDirectory, relativePath);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, html, "utf8");
  }

  for (const fileName of [
    "architecture.jpg",
    "memory-story.jpg",
    "podcast-prep.jpg",
    "research-workshop.jpg",
  ]) {
    await copyFile(
      path.join(repositoryRoot, "docs", "screenshots", fileName),
      path.join(assetsDirectory, fileName),
    );
  }
}

const directEntry = process.argv[1]
  ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
  : false;

if (directEntry) {
  await buildStaticSite();
  console.log("Static site built in dist-static/");
}
