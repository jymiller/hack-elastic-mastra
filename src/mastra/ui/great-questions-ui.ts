import {
  registerApiRoute,
  type ContextWithMastra,
} from "@mastra/core/server";
import { randomBytes } from "node:crypto";
import { z } from "zod";

import { createUiRequestContext } from "../../lib/observability-context.js";
import { primaryConversationalModel } from "../../lib/model-fallback.js";
import { getElasticsearchClient } from "../../lib/elasticsearch.js";
import {
  decisionAlias,
  memoryAlias,
  relationAlias,
} from "../../lib/memory-indices.js";
import {
  formatPerspectiveBriefForContext,
  perspectiveBriefSchema,
} from "../../lib/perspective-brief.js";
import { searchPodcastMemory } from "../../lib/podcast-memory-search.js";
import { greatQuestionsAgent } from "../agents/great-questions-agent.js";
import {
  appHeaderCss,
  renderAppHeader,
} from "./app-navigation.js";

const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(12_000),
      }),
    )
    .min(1)
    .max(30),
  notebook: z
    .object({
      id: z.string().regex(/^[a-zA-Z0-9_-]+$/).max(80),
      name: z.string().trim().min(1).max(120),
    })
    .optional(),
});

const searchRequestSchema = z.object({
  query: z.string().trim().min(2).max(500),
  limit: z.number().int().min(1).max(8).default(5),
});

const page = String.raw`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta
      name="description"
      content="Great Questions AI — a living research brain for ideas that evolve."
    />
    <title>Great Questions AI</title>
    <style>
      :root {
        color-scheme: dark;
        --ink: #f5f0e7;
        --ink-soft: #b9b4aa;
        --night: #0a0d0c;
        --panel: #111513;
        --panel-2: #161c19;
        --line: rgba(245, 240, 231, 0.13);
        --green: #a8f0c6;
        --green-deep: #19563c;
        --amber: #f2bc75;
        --blue: #9ac9ff;
        --shadow: 0 30px 80px rgba(0, 0, 0, 0.28);
      }

      * { box-sizing: border-box; }

      html, body { margin: 0; min-height: 100%; }

      body {
        background:
          radial-gradient(circle at 12% 5%, rgba(38, 104, 73, 0.24), transparent 32rem),
          radial-gradient(circle at 86% 20%, rgba(112, 72, 32, 0.12), transparent 30rem),
          var(--night);
        color: var(--ink);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        line-height: 1.5;
      }

      button, textarea { font: inherit; }
      button, a { -webkit-tap-highlight-color: transparent; }
      a { color: inherit; }

      .shell {
        min-height: 100vh;
        display: grid;
        grid-template-rows: auto auto 1fr;
        overflow-x: hidden;
      }

      header {
        min-height: 76px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
        padding: 16px 28px;
        border-bottom: 1px solid var(--line);
        background: rgba(10, 13, 12, 0.74);
        backdrop-filter: blur(18px);
        position: sticky;
        top: 0;
        z-index: 10;
      }

      .brand { display: flex; align-items: center; gap: 13px; }
      .mark {
        width: 42px;
        height: 42px;
        display: grid;
        place-items: center;
        border: 1px solid rgba(168, 240, 198, 0.45);
        border-radius: 50%;
        color: var(--green);
        font-family: Georgia, "Times New Roman", serif;
        font-size: 20px;
        letter-spacing: -0.08em;
        background: rgba(168, 240, 198, 0.05);
      }

      .brand strong { display: block; font-size: 15px; letter-spacing: 0.01em; }
      .brand span { display: block; color: var(--ink-soft); font-size: 12px; }

      ${appHeaderCss}
      .research-controls {
        min-height: 48px;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 10px;
        padding: 7px 28px;
        border-bottom: 1px solid var(--line);
        background: rgba(10, 13, 12, .54);
      }
      .notebook-picker {
        display: flex; align-items: center; gap: 7px; padding: 4px 6px 4px 10px;
        border: 1px solid var(--line); border-radius: 999px; color: var(--ink-soft);
        font-size: 9px; letter-spacing: .08em; text-transform: uppercase;
      }
      .notebook-picker select {
        max-width: 180px; border: 0; outline: 0; color: var(--ink); background: transparent;
        font: 11px ui-sans-serif, system-ui; text-transform: none; cursor: pointer;
      }
      .notebook-picker option { color: #111; background: #fff; }
      .live {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: var(--ink-soft);
        font-size: 12px;
      }
      .live::before {
        content: "";
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--green);
        box-shadow: 0 0 0 5px rgba(168, 240, 198, 0.08);
      }

      .trace-link {
        text-decoration: none;
        border: 1px solid var(--line);
        border-radius: 999px;
        padding: 8px 12px;
        background: transparent;
        color: var(--ink-soft);
        font-size: 12px;
        cursor: pointer;
        transition: 160ms ease;
      }
      .trace-link:hover { color: var(--ink); border-color: rgba(168, 240, 198, 0.4); }

      main {
        min-height: 0;
        display: grid;
        grid-template-columns: minmax(0, 1fr) 360px;
      }

      .research {
        min-width: 0;
        min-height: calc(100vh - 77px);
        display: grid;
        grid-template-rows: auto auto minmax(280px, 1fr) auto;
        padding: 58px clamp(26px, 6vw, 92px) 40px;
      }

      .eyebrow {
        color: var(--green);
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.17em;
        text-transform: uppercase;
      }

      h1 {
        max-width: 900px;
        margin: 12px 0 14px;
        font: 400 clamp(36px, 6vw, 72px) / 0.98 Georgia, "Times New Roman", serif;
        letter-spacing: -0.045em;
      }

      .intro {
        max-width: 690px;
        margin: 0;
        color: var(--ink-soft);
        font-size: 15px;
      }

      .starters {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
        margin: 38px 0 42px;
      }

      .starter {
        min-height: 84px;
        padding: 14px 15px;
        text-align: left;
        color: var(--ink);
        border: 1px solid var(--line);
        border-radius: 14px;
        background: linear-gradient(145deg, rgba(255,255,255,0.035), rgba(255,255,255,0.012));
        cursor: pointer;
        transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
      }
      .starter:hover {
        transform: translateY(-2px);
        border-color: rgba(168, 240, 198, 0.4);
        background: rgba(168, 240, 198, 0.045);
      }
      .starter b { display: block; margin-bottom: 5px; font-size: 13px; }
      .starter span { display: block; color: var(--ink-soft); font-size: 11px; line-height: 1.4; }

      .conversation {
        min-height: 0;
        overflow-y: auto;
        padding: 12px 10px 54px 0;
        scrollbar-color: rgba(245,240,231,0.2) transparent;
      }

      .empty-note {
        display: flex;
        gap: 12px;
        align-items: flex-start;
        max-width: 620px;
        padding: 16px 0;
        color: var(--ink-soft);
        font-size: 13px;
      }
      .empty-note .line { width: 34px; height: 1px; background: var(--green); margin-top: 10px; flex: 0 0 auto; }

      .message { margin: 32px 0; animation: enter 240ms ease-out both; }
      .message .label {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 7px;
        color: var(--ink-soft);
        font-size: 10px;
        letter-spacing: 0.13em;
        text-transform: uppercase;
      }
      .message .label a {
        color: var(--green);
        font-size: 9px;
        letter-spacing: 0.08em;
        text-decoration: none;
      }
      .message .label a:hover { text-decoration: underline; }
      .message.user { display: flex; flex-direction: column; align-items: flex-end; }
      .message.user .bubble {
        max-width: min(720px, 90%);
        border-radius: 17px 17px 4px 17px;
        padding: 13px 16px;
        background: #e9e4db;
        color: #161a18;
      }
      .message.assistant .bubble {
        max-width: 820px;
        font-family: Georgia, "Times New Roman", serif;
        font-size: 18px;
        line-height: 1.74;
      }
      .message.assistant .bubble a { color: var(--green); text-decoration-thickness: 1px; }
      .message.assistant .bubble.answer-shell {
        max-width: 900px; padding: 30px 34px; border: 1px solid var(--line); border-radius: 17px;
        background: linear-gradient(145deg, rgba(168,240,198,.045), rgba(255,255,255,.014));
        box-shadow: 0 28px 70px rgba(0,0,0,.16);
      }
      .answer-prose { display: grid; gap: 17px; }
      .answer-prose p { margin: 0; color: #d8d3c9; font: 16px/1.68 Georgia, serif; }
      .answer-prose p.answer-lead { max-width: 780px; color: var(--ink); font-size: 23px; line-height: 1.43; letter-spacing: -.012em; }
      .answer-prose h2 { margin: 17px 0 0; padding-top: 22px; border-top: 1px solid var(--line); color: var(--ink); font: 400 27px/1.08 Georgia, serif; letter-spacing: -.025em; }
      .answer-prose h3 { margin: 12px 0 -6px; color: var(--green); font: 700 10px/1.2 ui-sans-serif, system-ui; letter-spacing: .13em; text-transform: uppercase; }
      .answer-prose ul, .answer-prose ol { display: grid; gap: 10px; margin: 0; padding: 0 0 0 22px; color: #d8d3c9; }
      .answer-prose li { padding-left: 5px; font: 15px/1.56 Georgia, serif; }
      .answer-prose li::marker { color: var(--green); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 10px; }
      .answer-prose blockquote { margin: 4px 0; padding: 18px 22px; border-left: 1px solid var(--amber); color: var(--ink); background: rgba(242,188,117,.035); font: 19px/1.5 Georgia, serif; }
      .answer-prose .answer-source { padding-top: 13px; border-top: 1px solid var(--line); color: var(--amber); font: 9px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .04em; }

      .perspective-message { max-width: 980px; }
      .perspective-brief {
        display: grid;
        gap: 20px;
        padding: 10px 0 26px;
      }
      .brief-headline {
        margin: 0 0 10px;
        max-width: 850px;
        color: var(--ink);
        font: 31px/1.12 Georgia, "Times New Roman", serif;
        letter-spacing: -0.025em;
      }
      .brief-kicker {
        color: var(--green);
        font-size: 9px;
        font-weight: 750;
        letter-spacing: .15em;
        text-transform: uppercase;
      }
      .perspective-card {
        padding: 24px;
        border: 1px solid var(--line);
        border-radius: 15px;
        background: linear-gradient(145deg, rgba(255,255,255,.034), rgba(255,255,255,.012));
      }
      .perspective-card.john {
        padding: 30px;
        border-color: rgba(168,240,198,.29);
        background: linear-gradient(145deg, rgba(168,240,198,.075), rgba(168,240,198,.018));
      }
      .perspective-title { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 9px; }
      .perspective-title h3 { margin: 0; font-size: 12px; letter-spacing: .1em; text-transform: uppercase; }
      .confidence {
        flex: none; padding: 4px 7px; border-radius: 999px; color: var(--green);
        background: rgba(168,240,198,.075); font-size: 8px; letter-spacing: .08em; text-transform: uppercase;
      }
      .perspective-summary { color: var(--ink); font: 17px/1.52 Georgia, serif; }
      .john .perspective-summary { max-width: 830px; font-size: 21px; line-height: 1.47; }
      .attribution { margin-top: 11px; color: var(--ink-soft); font-size: 10px; line-height: 1.45; }
      .refs { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 12px; }
      .refs span { padding: 3px 6px; border: 1px solid var(--line); border-radius: 6px; color: var(--amber); font: 8px ui-monospace, SFMono-Regular, Menlo, monospace; }
      .guest-heading, .evolution-heading { margin-top: 14px; color: var(--ink-soft); font-size: 9px; font-weight: 750; letter-spacing: .14em; text-transform: uppercase; }
      .guest-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
      .guest-grid .perspective-card { min-height: 180px; }
      .evolution-card { padding: 28px; border: 1px solid rgba(242,188,117,.24); border-radius: 15px; background: rgba(242,188,117,.025); }
      .evolution-summary { margin: 12px 0 24px; max-width: 760px; color: var(--ink); font: 18px/1.6 Georgia, serif; }
      .timeline { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 16px; }
      .moment { position: relative; padding: 18px 16px 18px 20px; border-left: 1px solid var(--amber); background: rgba(255,255,255,.018); }
      .moment time { display: block; margin-bottom: 4px; color: var(--amber); font-size: 8px; letter-spacing: .09em; text-transform: uppercase; }
      .moment b { display: block; margin-bottom: 4px; font-size: 11px; }
      .moment p { margin: 0; color: var(--ink-soft); font: 12px/1.42 Georgia, serif; }
      .brief-foot { display: grid; grid-template-columns: minmax(0, 1fr) minmax(220px, .7fr); gap: 18px; }
      .brief-foot > div { padding: 22px 4px; border-top: 1px solid var(--line); color: var(--ink-soft); font-size: 11px; line-height: 1.65; }
      .brief-foot b { display: block; margin-bottom: 6px; color: var(--ink); font-size: 9px; letter-spacing: .1em; text-transform: uppercase; }
      .next-question { color: var(--green) !important; font-family: Georgia, serif; font-size: 14px !important; }

      .thinking {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        color: var(--ink-soft);
        font-size: 13px;
      }
      .thinking i, .thinking i::before, .thinking i::after {
        display: inline-block;
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: var(--green);
        animation: pulse 1.2s infinite ease-in-out;
      }
      .thinking i { position: relative; margin: 0 11px; animation-delay: -0.2s; }
      .thinking i::before, .thinking i::after { content: ""; position: absolute; top: 0; }
      .thinking i::before { left: -10px; animation-delay: -0.4s; }
      .thinking i::after { left: 10px; }

      .composer {
        position: relative;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 12px;
        align-items: end;
        padding: 12px;
        border: 1px solid rgba(245, 240, 231, 0.18);
        border-radius: 18px;
        background: rgba(17, 21, 19, 0.92);
        box-shadow: var(--shadow);
      }
      textarea {
        min-height: 48px;
        max-height: 150px;
        resize: none;
        border: 0;
        outline: 0;
        padding: 11px 10px;
        color: var(--ink);
        background: transparent;
      }
      textarea::placeholder { color: #7f817b; }
      .send {
        width: 46px;
        height: 46px;
        border: 0;
        border-radius: 13px;
        background: var(--green);
        color: #0b1710;
        font-size: 20px;
        cursor: pointer;
        transition: transform 140ms ease, opacity 140ms ease;
      }
      .send:hover { transform: translateY(-1px); }
      .send:disabled { cursor: wait; opacity: 0.45; transform: none; }

      aside {
        min-width: 0;
        padding: 42px 28px;
        border-left: 1px solid var(--line);
        background: rgba(17, 21, 19, 0.66);
        backdrop-filter: blur(20px);
        overflow-y: auto;
      }

      .aside-title { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
      .aside-title h2 { margin: 0; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; }
      .strategy {
        padding: 4px 8px;
        border-radius: 999px;
        color: var(--green);
        background: rgba(168, 240, 198, 0.07);
        font-size: 9px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .evidence-scope { margin-top: 18px; padding: 16px; border: 1px solid rgba(168,240,198,.18); border-radius: 12px; background: rgba(168,240,198,.035); }
      .evidence-scope span { display: block; color: var(--green); font-size: 8px; font-weight: 750; letter-spacing: .13em; text-transform: uppercase; }
      .evidence-scope p { margin: 8px 0 0; color: var(--ink); font: 14px/1.45 Georgia, serif; }
      .evidence-scope small { display: block; margin-top: 8px; color: var(--ink-soft); font-size: 9px; line-height: 1.4; }
      .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin: 12px 0 28px; }
      .stat { padding: 12px 9px; border: 1px solid var(--line); border-radius: 12px; }
      .stat strong { display: block; font: 400 22px/1 Georgia, serif; }
      .stat span { display: block; margin-top: 5px; color: var(--ink-soft); font-size: 9px; text-transform: uppercase; }

      .evidence-empty {
        padding: 24px 8px;
        border-top: 1px solid var(--line);
        color: var(--ink-soft);
        font-size: 12px;
      }

      .source {
        position: relative;
        display: block;
        padding: 22px 2px 24px 17px;
        border-top: 1px solid var(--line);
        text-decoration: none;
      }
      .source-layout {
        display: grid;
        grid-template-columns: 96px minmax(0, 1fr);
        gap: 11px;
      }
      .source-image {
        width: 96px;
        height: 64px;
        margin-top: 2px;
        object-fit: cover;
        border: 1px solid var(--line);
        border-radius: 9px;
        background: var(--panel-2);
      }
      .source-copy { min-width: 0; }
      .source::before {
        content: "";
        position: absolute;
        left: 0;
        top: 19px;
        width: 7px;
        height: 7px;
        border: 1px solid var(--green);
        border-radius: 50%;
      }
      .source:hover h3 { color: var(--green); }
      .source .meta { color: var(--amber); font-size: 9px; letter-spacing: 0.09em; text-transform: uppercase; }
      .source h3 { margin: 5px 0 6px; font-size: 12px; line-height: 1.4; transition: color 140ms ease; }
      .source .people { margin: -1px 0 7px; color: var(--blue); font-size: 9px; line-height: 1.35; }
      .source .viewpoint { margin-top: 8px; color: var(--ink-soft); font-size: 9px; letter-spacing: 0.08em; text-transform: uppercase; }
      .source p {
        display: -webkit-box;
        margin: 0;
        overflow: hidden;
        color: var(--ink-soft);
        font: 12px/1.45 Georgia, serif;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
      }

      .message.user.has-evidence .bubble { cursor: pointer; box-shadow: 0 0 0 2px rgba(168,240,198,.12); transition: box-shadow 140ms ease, transform 140ms ease; }
      .message.user.has-evidence .bubble:hover, .message.user.has-evidence .bubble:focus { outline: 0; box-shadow: 0 0 0 2px rgba(168,240,198,.36); transform: translateY(-1px); }
      .evidence-link { margin-top: 8px; padding: 0; border: 0; color: var(--green); background: transparent; font: 700 9px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .07em; text-transform: uppercase; cursor: pointer; }

      .error { color: #ffb4aa; }

      @keyframes pulse { 0%, 80%, 100% { opacity: 0.25; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }
      @keyframes enter { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

      @media (max-width: 980px) {
        main { grid-template-columns: minmax(0, 1fr); min-width: 0; }
        aside { min-width: 0; border-left: 0; border-top: 1px solid var(--line); }
        .research { min-height: auto; }
      }
      @media (max-width: 680px) {
        .research-controls { padding: 8px 16px; flex-wrap: wrap; justify-content: flex-start; }
        .live { margin-right: auto; }
        .notebook-picker { max-width: calc(100vw - 32px); }
        .trace-link { display: none; }
        .research { padding: 28px 16px 20px; }
        .starters { grid-template-columns: 1fr; }
        .starter { min-height: 68px; }
        aside { padding: 24px 16px; }
        .source-layout { grid-template-columns: 78px minmax(0, 1fr); }
        .source-image { width: 78px; height: 54px; }
        .guest-grid, .brief-foot { grid-template-columns: 1fr; }
        .brief-headline { font-size: 25px; }
      }
    </style>
  </head>
  <body>
    <div class="shell">
      ${renderAppHeader("research")}
      <div class="research-controls" aria-label="Research controls">
        <div class="live" id="live-status">Elasticsearch connected</div>
        <label class="notebook-picker"><span>Notebook</span><select id="notebook-select" aria-label="Active research notebook"></select></label>
        <button class="trace-link" id="new-notebook" type="button">New notebook +</button>
        <a class="trace-link" href="/agents/greatQuestionsAgent/traces" target="_blank" rel="noreferrer">Research traces ↗</a>
      </div>

      <main>
        <section class="research">
          <div>
            <div class="eyebrow">Research across time</div>
            <h1>What should we<br />ask next?</h1>
            <p class="intro">Search sourced podcast memory, inspect the evidence, and turn the history of an idea into a sharper next question.</p>
          </div>

          <div class="starters" aria-label="Question starters">
            <button class="starter" data-prompt="What did the podcast participants think about agent memory? Cite the episodes and timestamps, preserve host, co-host, and guest roles, and be explicit about uncertain speaker attribution.">
              <b>What did I think?</b><span>Recover an earlier position in its original context.</span>
            </button>
            <button class="starter" data-prompt="How did the discussion of agent memory change across these podcast episodes? Only claim a change when the retrieved evidence supports it, and cite every source.">
              <b>What changed?</b><span>Compare ideas without overwriting the historical record.</span>
            </button>
            <button class="starter" data-prompt="What unresolved assumptions in these podcast conversations would make the best questions for a future episode? Separate sourced observations from your proposed questions.">
              <b>What's next?</b><span>Turn unresolved assumptions into better questions.</span>
            </button>
          </div>

          <div class="conversation" id="conversation" aria-live="polite">
            <div class="empty-note" id="empty-note"><div class="line"></div><div>Ask about an idea, person, or theme. The agent will search the corpus before it answers and keep the source trail visible.</div></div>
          </div>

          <form class="composer" id="composer">
            <textarea id="prompt" rows="1" placeholder="Ask across the podcast memory…" aria-label="Your question"></textarea>
            <button class="send" id="send" type="submit" aria-label="Send question">↑</button>
          </form>
        </section>

        <aside>
          <div class="aside-title"><h2>Evidence trail</h2><span class="strategy" id="strategy">Hybrid search</span></div>
          <div class="evidence-scope"><span>Evidence for the active question</span><p id="evidence-query">Ask a question to retrieve its specific source trail.</p><small id="evidence-count">Each submitted question gets its own saved evidence set.</small></div>
          <div class="stats">
            <div class="stat"><strong>25</strong><span>Podcast episodes</span></div>
            <div class="stat"><strong id="memory-count">579</strong><span>Searchable memories</span></div>
          </div>
          <div id="evidence"><div class="evidence-empty">Sources will appear here as the agent searches Elasticsearch.</div></div>
        </aside>
      </main>
    </div>

    <script>
      (function () {
        var conversation = document.getElementById("conversation");
        var emptyNote = document.getElementById("empty-note");
        var form = document.getElementById("composer");
        var prompt = document.getElementById("prompt");
        var send = document.getElementById("send");
        var evidence = document.getElementById("evidence");
        var evidenceQuery = document.getElementById("evidence-query");
        var evidenceCount = document.getElementById("evidence-count");
        var strategy = document.getElementById("strategy");
        var notebookSelect = document.getElementById("notebook-select");
        var notebooksKey = "great-questions:research-notebooks:v2";
        var legacyStateKey = "great-questions:research-notebook:v1";
        var notebooks = {};
        var currentNotebookId = "";
        var history = [];
        var latestEvidence = null;
        var busy = false;

        function escapeHtml(value) {
          return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#039;");
        }

        function normalizeRoleLanguage(value) {
          return String(value)
            .replace(/\bguest\s+Eric Broda\b/gi, "Agentic Mesh co-host Eric Broda")
            .replace(/\bEric Broda\s+was\s+a\s+guest\b/gi, "Eric Broda was an Agentic Mesh co-host");
        }

        function renderAnswer(value) {
          var safe = escapeHtml(normalizeRoleLanguage(value));
          safe = safe.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1 ↗</a>');
          safe = safe.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
          return safe.replace(/\n/g, "<br />");
        }

        function renderRichAnswer(value) {
          var lines = escapeHtml(value).split("\n");
          var html = [];
          var paragraph = [];
          var list = [];
          var listType = "";
          var paragraphCount = 0;
          function inline(text) {
            return text
              .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1 ↗</a>')
              .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
          }
          function flushParagraph() {
            if (!paragraph.length) return;
            var value = inline(paragraph.join(" "));
            var sourceClass = /^(source|evidence|citation|receipt)s?\s*:/i.test(paragraph[0]) ? "answer-source" : "";
            var leadClass = paragraphCount === 0 && !sourceClass ? "answer-lead" : "";
            html.push('<p class="' + sourceClass + (sourceClass && leadClass ? " " : "") + leadClass + '">' + value + "</p>");
            paragraphCount += 1;
            paragraph = [];
          }
          function flushList() {
            if (!list.length) return;
            html.push("<" + listType + ">" + list.map(function (item) { return "<li>" + inline(item) + "</li>"; }).join("") + "</" + listType + ">");
            list = [];
            listType = "";
          }
          lines.forEach(function (line) {
            var trimmed = line.trim();
            if (!trimmed) { flushParagraph(); flushList(); return; }
            var heading = trimmed.match(/^(#{2,3})\s+(.+)$/);
            if (heading) { flushParagraph(); flushList(); var tag = heading[1].length === 2 ? "h2" : "h3"; html.push("<" + tag + ">" + inline(heading[2]) + "</" + tag + ">"); return; }
            var bullet = trimmed.match(/^[-*]\s+(.+)$/);
            var numbered = trimmed.match(/^\d+[.)]\s+(.+)$/);
            if (bullet || numbered) {
              flushParagraph();
              var nextType = numbered ? "ol" : "ul";
              if (listType && listType !== nextType) flushList();
              listType = nextType;
              list.push((bullet || numbered)[1]);
              return;
            }
            if (/^&gt;\s*/.test(trimmed)) { flushParagraph(); flushList(); html.push("<blockquote>" + inline(trimmed.replace(/^&gt;\s*/, "")) + "</blockquote>"); return; }
            flushList();
            paragraph.push(trimmed);
          });
          flushParagraph();
          flushList();
          return '<div class="answer-prose">' + html.join("") + "</div>";
        }

        function friendlyAgentError(error) {
          var message = error && error.message ? String(error.message) : "";
          if (/failed to fetch|network|load failed/i.test(message)) {
            return "The research agent is reconnecting. Please try again in a moment.";
          }
          return "The research agent could not answer right now. Please try again.";
        }

        function bindQuestionEvidence(wrapper, question, payload) {
          if (!wrapper || !payload || !Array.isArray(payload.hits)) return;
          wrapper.classList.add("has-evidence");
          var bubble = wrapper.querySelector(".bubble");
          var existing = wrapper.querySelector(".evidence-link");
          if (existing) existing.remove();
          var show = function () {
            latestEvidence = payload;
            renderEvidence(payload, question);
            saveNotebook();
          };
          bubble.setAttribute("role", "button");
          bubble.setAttribute("tabindex", "0");
          bubble.setAttribute("aria-label", "Show the evidence retrieved for this question");
          bubble.addEventListener("click", show);
          bubble.addEventListener("keydown", function (event) {
            if (event.key === "Enter" || event.key === " ") { event.preventDefault(); show(); }
          });
          var link = document.createElement("button");
          link.className = "evidence-link";
          link.type = "button";
          link.textContent = "Show " + payload.hits.length + " sources for this question →";
          link.addEventListener("click", show);
          wrapper.appendChild(link);
        }

        function addMessage(role, content, temporary, traceId, evidencePayload) {
          if (emptyNote) { emptyNote.remove(); emptyNote = null; }
          var wrapper = document.createElement("div");
          wrapper.className = "message " + role;
          if (temporary) wrapper.id = "thinking";
          var label = document.createElement("div");
          label.className = "label";
          label.textContent = role === "user" ? "You" : "Great Questions";
          if (traceId) {
            var traceLink = document.createElement("a");
            traceLink.href = "/agents/greatQuestionsAgent/traces?traceId=" + encodeURIComponent(traceId);
            traceLink.textContent = "Inspect trace ↗";
            traceLink.setAttribute("aria-label", "Inspect this answer trace in Mastra Studio");
            label.appendChild(traceLink);
          }
          var bubble = document.createElement("div");
          bubble.className = "bubble";
          if (temporary) bubble.innerHTML = '<span class="thinking"><i></i><span>Searching podcast memory…</span></span>';
          else if (role === "assistant") { bubble.classList.add("answer-shell"); bubble.innerHTML = renderRichAnswer(content); }
          else bubble.textContent = content;
          wrapper.appendChild(label);
          wrapper.appendChild(bubble);
          conversation.appendChild(wrapper);
          if (role === "user" && evidencePayload) bindQuestionEvidence(wrapper, content, evidencePayload);
          conversation.scrollTop = conversation.scrollHeight;
          return wrapper;
        }

        function renderRefs(ids) {
          if (!Array.isArray(ids) || ids.length === 0) return "";
          return '<div class="refs">' + ids.map(function (id) {
            return "<span>" + escapeHtml(id) + "</span>";
          }).join("") + "</div>";
        }

        function renderPerspectiveBrief(brief, traceId) {
          if (!brief || !brief.johnPerspective || !brief.evolution) return null;
          if (emptyNote) { emptyNote.remove(); emptyNote = null; }
          var wrapper = document.createElement("div");
          wrapper.className = "message assistant perspective-message";
          var label = document.createElement("div");
          label.className = "label";
          label.textContent = "Perspective brief";
          if (traceId) {
            var traceLink = document.createElement("a");
            traceLink.href = "/agents/greatQuestionsAgent/traces?traceId=" + encodeURIComponent(traceId);
            traceLink.textContent = "Inspect trace ↗";
            traceLink.setAttribute("aria-label", "Inspect this perspective trace in Mastra Studio");
            label.appendChild(traceLink);
          }
          var participants = Array.isArray(brief.guestPerspectives) && brief.guestPerspectives.length
            ? brief.guestPerspectives.map(function (guest) {
                return '<article class="perspective-card"><div class="perspective-title"><h3>' + escapeHtml(guest.name) + '</h3><span class="confidence">' + escapeHtml(guest.confidence) + ' confidence</span></div><div class="perspective-summary">' + renderAnswer(guest.summary) + '</div>' + renderRefs(guest.evidenceIds) + '</article>';
              }).join("")
            : '<article class="perspective-card"><div class="perspective-summary">No distinct participant perspective could be established from the retrieved evidence.</div></article>';
          var moments = Array.isArray(brief.evolution.moments) && brief.evolution.moments.length
            ? '<div class="timeline">' + brief.evolution.moments.map(function (moment) {
                return '<article class="moment"><time>' + escapeHtml(moment.date) + '</time><b>' + escapeHtml(moment.label) + '</b><p>' + renderAnswer(moment.summary) + '</p>' + renderRefs(moment.evidenceIds) + '</article>';
              }).join("") + "</div>"
            : '<div class="attribution">No dated change point could be established from the retrieved evidence.</div>';
          var uncertainties = Array.isArray(brief.uncertainties) && brief.uncertainties.length
            ? brief.uncertainties.map(function (item) { return "• " + escapeHtml(item); }).join("<br />")
            : "No additional uncertainty was stated.";
          var body = document.createElement("div");
          body.className = "perspective-brief";
          body.innerHTML =
            '<div class="brief-kicker">One query · three viewpoints</div>' +
            '<h2 class="brief-headline">' + escapeHtml(normalizeRoleLanguage(brief.headline)) + '</h2>' +
            '<article class="perspective-card john"><div class="perspective-title"><h3>Your sourced point of view</h3><span class="confidence">' + escapeHtml(brief.johnPerspective.confidence) + ' confidence</span></div><div class="perspective-summary">' + renderAnswer(brief.johnPerspective.summary) + '</div><div class="attribution">' + escapeHtml(brief.johnPerspective.attributionNote) + '</div>' + renderRefs(brief.johnPerspective.evidenceIds) + '</article>' +
            '<div class="guest-heading">Other participant perspectives</div><div class="guest-grid">' + participants + '</div>' +
            '<div class="evolution-heading">Evolution over time</div><section class="evolution-card"><div class="perspective-title"><h3>' + escapeHtml(brief.evolution.assessment) + '</h3><span class="confidence">dated evidence</span></div><div class="evolution-summary">' + renderAnswer(brief.evolution.summary) + '</div>' + moments + '</section>' +
            '<div class="brief-foot"><div><b>Uncertainty</b>' + uncertainties + '</div><div class="next-question"><b>Ask next</b>' + escapeHtml(brief.nextQuestion) + '</div></div>';
          wrapper.appendChild(label);
          wrapper.appendChild(body);
          conversation.appendChild(wrapper);
          conversation.scrollTop = conversation.scrollHeight;
          return wrapper;
        }

        function saveNotebook() {
          if (!currentNotebookId) return;
          notebooks[currentNotebookId] = {
            id: currentNotebookId,
            name: notebooks[currentNotebookId] ? notebooks[currentNotebookId].name : "Research notebook",
            history: history,
            evidence: latestEvidence,
            savedAt: new Date().toISOString()
          };
          try {
            localStorage.setItem(notebooksKey, JSON.stringify({ currentId: currentNotebookId, notebooks: notebooks }));
          } catch (_) {}
        }

        function renderNotebookOptions() {
          notebookSelect.innerHTML = Object.keys(notebooks).map(function (id) {
            return '<option value="' + escapeHtml(id) + '">' + escapeHtml(notebooks[id].name) + '</option>';
          }).join("");
          notebookSelect.value = currentNotebookId;
        }

        function resetNotebookView() {
          history = [];
          latestEvidence = null;
          conversation.innerHTML = '<div class="empty-note" id="empty-note"><div class="line"></div><div>Ask about an idea, person, or theme. The agent will search the corpus before it answers and keep the source trail visible.</div></div>';
          emptyNote = document.getElementById("empty-note");
          evidence.innerHTML = '<div class="evidence-empty">Sources will appear here as the agent searches Elasticsearch.</div>';
          evidenceQuery.textContent = "Ask a question to retrieve its specific source trail.";
          evidenceCount.textContent = "Each submitted question gets its own saved evidence set.";
          strategy.textContent = "Hybrid search";
        }

        function showNotebook(id) {
          if (!notebooks[id]) return;
          currentNotebookId = id;
          resetNotebookView();
          var saved = notebooks[id];
          history = Array.isArray(saved.history) ? saved.history.filter(function (message) {
            return message && (message.role === "user" || message.role === "assistant") && typeof message.content === "string";
          }).slice(-30) : [];
          history.forEach(function (message) {
            if (message.role === "assistant" && message.perspective) {
              renderPerspectiveBrief(message.perspective, message.traceId);
            } else {
              addMessage(message.role, message.content, false, message.traceId, message.evidence);
            }
          });
          if (saved.evidence && Array.isArray(saved.evidence.hits)) {
            var lastQuestion = history.slice().reverse().find(function (message) { return message.role === "user"; });
            latestEvidence = saved.evidence;
            renderEvidence(latestEvidence, latestEvidence.question || (lastQuestion && lastQuestion.content));
          }
          notebookSelect.value = id;
          saveNotebook();
          prompt.focus();
        }

        function restoreNotebook() {
          try {
            var collection = JSON.parse(localStorage.getItem(notebooksKey) || "null");
            if (collection && collection.notebooks) {
              notebooks = collection.notebooks;
              currentNotebookId = collection.currentId;
            } else {
              var legacy = JSON.parse(localStorage.getItem(legacyStateKey) || "null");
              notebooks = {
                research: {
                  id: "research",
                  name: "Agent memory research",
                  history: legacy && Array.isArray(legacy.history) ? legacy.history : [],
                  evidence: legacy ? legacy.evidence : null,
                  savedAt: new Date().toISOString()
                }
              };
              currentNotebookId = "research";
            }
          } catch (_) {
            notebooks = {};
          }
          if (!Object.keys(notebooks).length) {
            notebooks.research = { id: "research", name: "Agent memory research", history: [], evidence: null };
          }
          if (!notebooks[currentNotebookId]) currentNotebookId = Object.keys(notebooks)[0];
          renderNotebookOptions();
          showNotebook(currentNotebookId);
        }

        function createNotebook() {
          saveNotebook();
          var name = window.prompt("Name this research notebook", "New podcast research");
          if (!name || !name.trim()) return;
          var id = "notebook-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
          notebooks[id] = { id: id, name: name.trim().slice(0, 120), history: [], evidence: null };
          currentNotebookId = id;
          renderNotebookOptions();
          showNotebook(id);
        }

        function renderEvidence(payload, question) {
          var scopedQuestion = question || payload.question || "The active question";
          evidenceQuery.textContent = scopedQuestion;
          strategy.textContent = payload.strategy === "hybrid" ? "Hybrid search" : "Lexical fallback";
          if (!payload.hits || payload.hits.length === 0) {
            evidenceCount.textContent = "No matching passages for this question.";
            evidence.innerHTML = '<div class="evidence-empty">No directly relevant transcript evidence was found.</div>';
            return;
          }
          evidenceCount.textContent = payload.hits.length + " relevant transcript passages. Click any one to open its exact timestamp.";
          function roleLine(hit) {
            var names = Array.isArray(hit.people) ? hit.people.filter(Boolean) : [];
            if (String(hit.memory_id || "").indexOf("agentic-mesh:") === 0) {
              var cohosts = ["Eric Broda", "John Miller"].filter(function (name) { return names.indexOf(name) >= 0; });
              var additional = names.filter(function (name) { return cohosts.indexOf(name) < 0; });
              var meshLine = cohosts.length ? "Co-hosts " + cohosts.join(" · ") : "Agentic Mesh participants";
              return additional.length ? meshLine + " · With " + additional.join(" · ") : meshLine;
            }
            if (String(hit.memory_id || "").indexOf("podcast:") === 0) {
              var damaGuests = names.filter(function (name) { return name !== "John Miller"; });
              return "Host John Miller" + (damaGuests.length ? " · Guest " + damaGuests.join(" · ") : "");
            }
            return names.length ? "Participants " + names.join(" · ") : "Episode participants not identified";
          }
          evidence.innerHTML = payload.hits.map(function (hit) {
            var image = hit.source.image_url
              ? '<img class="source-image" src="' + escapeHtml(hit.source.image_url) + '" alt="Episode thumbnail" loading="lazy" />'
              : '<div class="source-image"></div>';
            var people = roleLine(hit);
            return '<a class="source" href="' + escapeHtml(hit.source.url) + '" target="_blank" rel="noreferrer">' +
              '<div class="source-layout">' + image + '<div class="source-copy">' +
              '<div class="meta">' + escapeHtml(hit.source.date) + ' · ' + escapeHtml(hit.source.locator) + '</div>' +
              '<h3>' + escapeHtml(hit.source.title) + '</h3>' +
              '<div class="people">' + escapeHtml(people) + '</div>' +
              '<p>' + escapeHtml(hit.text) + '</p>' +
              '<div class="viewpoint">Point-of-view evidence · attribution unverified</div>' +
              '</div></div></a>';
          }).join("");
        }

        async function loadStatus() {
          try {
            var response = await fetch("/great-questions/api/status");
            if (!response.ok) throw new Error("status unavailable");
            var data = await response.json();
            document.getElementById("memory-count").textContent = data.memories;
          } catch (_) {
            document.getElementById("live-status").textContent = "Corpus status unavailable";
          }
        }

        async function ask(question) {
          if (!question || busy) return;
          busy = true;
          send.disabled = true;
          prompt.value = "";
          var userMessage = addMessage("user", question, false);
          var userHistory = { role: "user", content: question };
          history.push(userHistory);
          var thinking = addMessage("assistant", "", true);
          evidenceQuery.textContent = question;
          evidenceCount.textContent = "Searching this question across the podcast corpus…";

          var searchPromise = fetch("/great-questions/api/search", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ query: question, limit: 5 })
          }).then(function (response) {
            if (!response.ok) throw new Error("Search failed");
            return response.json();
          }).then(function (payload) {
            payload.question = question;
            latestEvidence = payload;
            userHistory.evidence = payload;
            bindQuestionEvidence(userMessage, question, payload);
            renderEvidence(payload, question);
            saveNotebook();
          }).catch(function () {
            evidence.innerHTML = '<div class="evidence-empty">Evidence is reconnecting and will return with the next question.</div>';
          });

          try {
            var response = await fetch("/great-questions/api/chat", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                messages: history.slice(-30),
                notebook: {
                  id: currentNotebookId,
                  name: notebooks[currentNotebookId].name
                }
              })
            });
            var data = await response.json();
            if (!response.ok) throw new Error(data.error || "The agent could not answer.");
            thinking.remove();
            if (data.perspective) renderPerspectiveBrief(data.perspective, data.traceId);
            else addMessage("assistant", data.text, false, data.traceId);
            history.push({ role: "assistant", content: data.text, perspective: data.perspective, traceId: data.traceId });
            saveNotebook();
          } catch (error) {
            thinking.remove();
            var failed = addMessage("assistant", "", false, data && data.traceId);
            failed.querySelector(".bubble").innerHTML = '<span class="error">' + escapeHtml(friendlyAgentError(error)) + '</span>';
          } finally {
            await searchPromise;
            busy = false;
            send.disabled = false;
            prompt.focus();
          }
        }

        form.addEventListener("submit", function (event) {
          event.preventDefault();
          ask(prompt.value.trim());
        });
        prompt.addEventListener("keydown", function (event) {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            form.requestSubmit();
          }
        });
        prompt.addEventListener("input", function () {
          prompt.style.height = "auto";
          prompt.style.height = Math.min(prompt.scrollHeight, 150) + "px";
        });
        document.querySelectorAll(".starter").forEach(function (button) {
          button.addEventListener("click", function () {
            prompt.value = button.getAttribute("data-prompt") || "";
            prompt.focus();
          });
        });
        document.getElementById("new-notebook").addEventListener("click", createNotebook);
        notebookSelect.addEventListener("change", function () {
          saveNotebook();
          showNotebook(notebookSelect.value);
        });

        restoreNotebook();
        loadStatus();
        prompt.focus();
      })();
    </script>
  </body>
</html>`;

export const greatQuestionsUiRoutes = [
  registerApiRoute("/great-questions", {
    method: "GET",
    requiresAuth: false,
    handler: (context: ContextWithMastra) => context.html(page),
  }),
  registerApiRoute("/great-questions/api/status", {
    method: "GET",
    requiresAuth: false,
    handler: async (context: ContextWithMastra) => {
      try {
        const client = getElasticsearchClient();
        const [memories, relations, decisions] = await Promise.all([
          client.count({ index: memoryAlias }),
          client.count({ index: relationAlias }),
          client.count({ index: decisionAlias }),
        ]);

        return context.json({
          memories: memories.count,
          relations: relations.count,
          decisions: decisions.count,
        });
      } catch (error) {
        return context.json(
          { error: error instanceof Error ? error.message : "Corpus status failed." },
          503,
        );
      }
    },
  }),
  registerApiRoute("/great-questions/api/search", {
    method: "POST",
    requiresAuth: false,
    handler: async (context: ContextWithMastra) => {
      const parsed = searchRequestSchema.safeParse(await context.req.json());
      if (!parsed.success) {
        return context.json({ error: "Enter a valid search query." }, 400);
      }

      try {
        return context.json(
          await searchPodcastMemory(
            getElasticsearchClient(),
            parsed.data.query,
            parsed.data.limit,
          ),
        );
      } catch (error) {
        return context.json(
          { error: error instanceof Error ? error.message : "Memory search failed." },
          503,
        );
      }
    },
  }),
  registerApiRoute("/great-questions/api/chat", {
    method: "POST",
    requiresAuth: false,
    handler: async (context: ContextWithMastra) => {
      const parsed = chatRequestSchema.safeParse(await context.req.json());
      if (!parsed.success) {
        return context.json({ error: "Enter a valid conversation." }, 400);
      }

      const traceId = randomBytes(16).toString("hex");
      const requestContext = createUiRequestContext(
        "great-questions-ui",
        parsed.data.notebook
          ? {
              sessionId: `notebook-${parsed.data.notebook.id}`,
              researchNotebookName: parsed.data.notebook.name,
            }
          : {},
      );

      try {
        const conversation = parsed.data.messages
          .map((message) =>
            `${message.role === "user" ? "User" : "Assistant"}: ${message.content}`,
          )
          .join("\n\n");
        const response = await greatQuestionsAgent.generate(
          `Continue this research conversation. Treat the final User message as the request to answer.

For this single query, produce one evidence-grounded perspective brief that:
- summarizes John's sourced point of view first;
- separates each other participant's perspective and preserves their actual role;
- assesses whether the available dated evidence proves change, stability, a mixed pattern, or is insufficient;
- never attributes ambiguous caption text to John or another participant;
- carries the retrieved memory IDs into the relevant evidenceIds arrays;
- proposes one strong next question after the evidence comparison.

Role truth for every response: The Agentic Mesh Podcast is co-hosted by Eric Broda and John Miller, so neither is a guest. DAMA LA is hosted solely by John Miller; its other named episode participant is the guest. The schema field guestPerspectives is retained for compatibility, but place any non-John perspective there with the person's correct role in the wording.

If the corpus cannot establish John's view, say so with confidence "insufficient" rather than guessing. Likewise, use an empty guestPerspectives or evolution.moments array when the evidence cannot support them.

Conversation:
${conversation}`,
          {
            requestContext,
            structuredOutput: {
              schema: perspectiveBriefSchema,
              model: primaryConversationalModel(),
              jsonPromptInjection: "inline",
              errorStrategy: "warn",
            },
            tracingOptions: {
              traceId,
              tags: ["custom-ui"],
            },
          },
        );
        const structured = perspectiveBriefSchema.safeParse(response.object);
        const perspective = structured.success ? structured.data : undefined;
        const text = perspective
          ? formatPerspectiveBriefForContext(perspective)
          : response.text;
        return context.json({
          text,
          perspective,
          traceId,
        });
      } catch (error) {
        return context.json(
          {
            error: error instanceof Error ? error.message : "Agent response failed.",
            traceId,
          },
          503,
        );
      }
    },
  }),
];
