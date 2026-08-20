import { Mastra } from "@mastra/core/mastra";
import { LibSQLStore } from "@mastra/libsql";
import { MCPServer } from "@mastra/mcp";
import { MastraStorageExporter, Observability } from "@mastra/observability";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { greatQuestionsAgent } from "./agents/great-questions-agent.js";
import { agenticMeshIngestionAgent } from "./agents/agentic-mesh-ingestion-agent.js";
import { industryResearchAgent } from "./agents/industry-research-agent.js";
import { podcastPrepAgent } from "./agents/podcast-prep-agent.js";
import {
  agenticMeshIngestionPlanTool,
  agenticMeshIngestionWriteTool,
} from "./tools/agentic-mesh-ingestion.js";
import { elasticConnectivityTool } from "./tools/elastic-connectivity.js";
import { podcastMemorySearchTool } from "./tools/podcast-memory-search.js";
import { architectureUiRoutes } from "./ui/architecture-ui.js";
import { demoUiRoutes } from "./ui/demo-ui.js";
import { greatQuestionsUiRoutes } from "./ui/great-questions-ui.js";
import { podcastPrepUiRoutes } from "./ui/podcast-prep-ui.js";

const greatQuestionsMcp = new MCPServer({
  id: "great-questions",
  name: "Great Questions",
  version: "0.1.0",
  agents: {
    agenticMeshIngestionAgent,
    greatQuestionsAgent,
    industryResearchAgent,
    podcastPrepAgent,
  },
  tools: {
    agenticMeshIngestionPlanTool,
    agenticMeshIngestionWriteTool,
    elasticConnectivityTool,
    podcastMemorySearchTool,
  },
});

const storage = new LibSQLStore({
  id: "great-questions-storage",
  url: pathToFileURL(
    resolve(process.env.INIT_CWD ?? process.cwd(), "data/mastra.db"),
  ).href,
});

const observability = new Observability({
  configs: {
    default: {
      serviceName: "great-questions-ai",
      exporters: [new MastraStorageExporter()],
      requestContextKeys: [
        "userId",
        "surface",
        "sessionId",
        "podcastPrepName",
        "researchNotebookName",
      ],
    },
  },
});

export const mastra = new Mastra({
  storage,
  observability,
  agents: {
    agenticMeshIngestionAgent,
    greatQuestionsAgent,
    industryResearchAgent,
    podcastPrepAgent,
  },
  mcpServers: {
    "great-questions": greatQuestionsMcp,
  },
  tools: {
    agenticMeshIngestionPlanTool,
    agenticMeshIngestionWriteTool,
    elasticConnectivityTool,
    podcastMemorySearchTool,
  },
  server: {
    apiRoutes: [
      ...greatQuestionsUiRoutes,
      ...podcastPrepUiRoutes,
      ...architectureUiRoutes,
      ...demoUiRoutes,
    ],
    build: {
      openAPIDocs: true,
      swaggerUI: true,
    },
  },
});
