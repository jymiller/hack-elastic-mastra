import { Mastra } from "@mastra/core/mastra";
import { MCPServer } from "@mastra/mcp";

import { greatQuestionsAgent } from "./agents/great-questions-agent.js";
import { elasticConnectivityTool } from "./tools/elastic-connectivity.js";
import { podcastMemorySearchTool } from "./tools/podcast-memory-search.js";

const greatQuestionsMcp = new MCPServer({
  id: "great-questions",
  name: "Great Questions",
  version: "0.1.0",
  agents: {
    greatQuestionsAgent,
  },
  tools: {
    elasticConnectivityTool,
    podcastMemorySearchTool,
  },
});

export const mastra = new Mastra({
  agents: {
    greatQuestionsAgent,
  },
  mcpServers: {
    "great-questions": greatQuestionsMcp,
  },
  tools: {
    elasticConnectivityTool,
    podcastMemorySearchTool,
  },
  server: {
    build: {
      openAPIDocs: true,
      swaggerUI: true,
    },
  },
});
