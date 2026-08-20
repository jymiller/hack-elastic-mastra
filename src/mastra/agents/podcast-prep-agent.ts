import { Agent } from "@mastra/core/agent";

import { conversationalModel } from "../../lib/model-fallback.js";
import { podcastMemorySearchTool } from "../tools/podcast-memory-search.js";
import { industryResearchAgent } from "./industry-research-agent.js";
import {
  PODCAST_PREP_AGENT_DESCRIPTION,
  PODCAST_PREP_AGENT_INSTRUCTIONS,
} from "./podcast-prep-policy.js";

export const podcastPrepAgent = new Agent({
  id: "podcastPrepAgent",
  name: "Podcast Prep",
  description: PODCAST_PREP_AGENT_DESCRIPTION,
  instructions: PODCAST_PREP_AGENT_INSTRUCTIONS,
  model: conversationalModel(),
  defaultOptions: {
    maxSteps: 8,
  },
  agents: {
    industryResearchAgent,
  },
  tools: {
    podcastMemorySearchTool,
  },
});
