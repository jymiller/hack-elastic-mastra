import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { Agent } from "@mastra/core/agent";

import {
  INDUSTRY_RESEARCH_AGENT_DESCRIPTION,
  INDUSTRY_RESEARCH_AGENT_INSTRUCTIONS,
  INDUSTRY_RESEARCH_SEARCH_BUDGET,
  resolveIndustryResearchModel,
} from "./industry-research-policy.js";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY?.trim() || undefined,
  appName: "Great Questions AI",
  appUrl: "https://github.com/jymiller/hack-elastic-mastra",
  compatibility: "strict",
});

const webSearchTool = openrouter.tools.webSearch({
  // Exa honors maxResults; native provider search may ignore that limit.
  engine: "exa",
  maxResults: INDUSTRY_RESEARCH_SEARCH_BUDGET.maxResultsPerSearch,
});

if (webSearchTool.type !== "provider") {
  throw new Error("OpenRouter did not create a provider-defined web search tool.");
}

export const industryResearchAgent = new Agent({
  id: "industryResearchAgent",
  name: "Definitive Industry Research",
  description: INDUSTRY_RESEARCH_AGENT_DESCRIPTION,
  instructions: INDUSTRY_RESEARCH_AGENT_INSTRUCTIONS,
  model: openrouter(resolveIndustryResearchModel()),
  defaultOptions: {
    // Three tool steps plus a final synthesis step bounds the agentic loop.
    maxSteps: INDUSTRY_RESEARCH_SEARCH_BUDGET.maxSteps,
  },
  tools: {
    webSearch: webSearchTool,
  },
});
