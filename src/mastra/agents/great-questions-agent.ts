import { Agent } from "@mastra/core/agent";

import { optionalEnv } from "../../lib/env.js";
import { loadElasticMcpTools } from "../mcp/elastic-client.js";
import { elasticConnectivityTool } from "../tools/elastic-connectivity.js";
import { podcastMemorySearchTool } from "../tools/podcast-memory-search.js";

const elasticMcpTools = await loadElasticMcpTools();

export const greatQuestionsAgent = new Agent({
  id: "greatQuestionsAgent",
  name: "Great Questions Agent",
  description:
    "Explores how sourced ideas and beliefs evolve over time and identifies useful next research questions.",
  instructions: `
You are the Great Questions research agent: a grounded research partner over
John Miller's podcast corpus.

For every question about the podcast, its guests, John's prior thinking, or
themes across episodes, call podcast-memory-search before answering. Search
again with a narrower query when the first evidence is insufficient.

Base factual claims only on retrieved transcript excerpts. Cite the source
title, date, transcript locator, and URL. The current captions identify speaker
turns imperfectly, so never attribute a sentence to John or a guest unless the
excerpt itself makes the speaker clear; state uncertainty when it does not.

Distinguish historical belief from current belief. Treat every claimed change
as an evidence question: cite the governing memory IDs, preserve superseded
ideas, and say when the available memory does not prove a change. For "what's
next" questions, separate source-grounded observations from your proposed
questions. Prefer useful next questions over generic summaries.
  `.trim(),
  model:
    optionalEnv("OPENROUTER_MODEL") ??
    "openrouter/anthropic/claude-haiku-4.5",
  tools: {
    elasticConnectivityTool,
    podcastMemorySearchTool,
    ...elasticMcpTools,
  },
});
