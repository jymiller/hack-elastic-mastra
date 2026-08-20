import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_INDUSTRY_RESEARCH_MODEL,
  INDUSTRY_RESEARCH_AGENT_DESCRIPTION,
  INDUSTRY_RESEARCH_AGENT_INSTRUCTIONS,
  INDUSTRY_RESEARCH_SEARCH_BUDGET,
  normalizeOpenRouterModelId,
  resolveIndustryResearchModel,
} from "../src/mastra/agents/industry-research-policy.js";

test("resolves the research model in documented precedence order", () => {
  assert.equal(
    resolveIndustryResearchModel({
      INDUSTRY_RESEARCH_MODEL: "openrouter/google/gemini-2.5-flash",
      OPENROUTER_MODEL: "openrouter/anthropic/claude-haiku-4.5",
    }),
    "google/gemini-2.5-flash",
  );
  assert.equal(
    resolveIndustryResearchModel({
      OPENROUTER_MODEL: "openrouter/anthropic/claude-haiku-4.5",
    }),
    "anthropic/claude-haiku-4.5",
  );
  assert.equal(resolveIndustryResearchModel({}), DEFAULT_INDUSTRY_RESEARCH_MODEL);
});

test("normalizes Mastra-style OpenRouter model IDs for the provider SDK", () => {
  assert.equal(
    normalizeOpenRouterModelId(" openrouter/openai/gpt-4.1-mini "),
    "openai/gpt-4.1-mini",
  );
  assert.equal(
    normalizeOpenRouterModelId("anthropic/claude-haiku-4.5"),
    "anthropic/claude-haiku-4.5",
  );
  assert.throws(() => normalizeOpenRouterModelId("openrouter/"), /cannot be empty/);
});

test("keeps public research isolated, sourced, and cost bounded", () => {
  assert.deepEqual(INDUSTRY_RESEARCH_SEARCH_BUDGET, {
    maxResultsPerSearch: 5,
    maxSearches: 3,
    maxTotalResults: 15,
    maxSteps: 4,
  });
  assert.match(INDUSTRY_RESEARCH_AGENT_DESCRIPTION, /current, public industry research/i);
  assert.match(INDUSTRY_RESEARCH_AGENT_DESCRIPTION, /private podcast corpus/i);
  assert.match(INDUSTRY_RESEARCH_AGENT_INSTRUCTIONS, /no more than THREE webSearch calls/);
  assert.match(INDUSTRY_RESEARCH_AGENT_INSTRUCTIONS, /Primary and official sources/);
  assert.match(INDUSTRY_RESEARCH_AGENT_INSTRUCTIONS, /Conflicts, gaps, and uncertainty/);
  assert.match(INDUSTRY_RESEARCH_AGENT_INSTRUCTIONS, /Markdown\s+link/);
  assert.match(INDUSTRY_RESEARCH_AGENT_INSTRUCTIONS, /podcast corpus, Elasticsearch/);
});
