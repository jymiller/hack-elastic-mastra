import { MCPClient } from "@mastra/mcp";

import { optionalEnv } from "../../lib/env.js";

export async function loadElasticMcpTools() {
  const url = optionalEnv("ELASTIC_MCP_URL");
  const apiKey = optionalEnv("ELASTIC_MCP_API_KEY");

  if (!url && !apiKey) {
    return {};
  }

  if (!url || !apiKey) {
    throw new Error(
      "ELASTIC_MCP_URL and ELASTIC_MCP_API_KEY must either both be set or both be omitted.",
    );
  }

  const client = new MCPClient({
    id: "elastic-agent-builder",
    servers: {
      elastic: {
        url: new URL(url),
        allowedHosts: [new URL(url).hostname],
        requestInit: {
          headers: {
            Authorization: `ApiKey ${apiKey}`,
          },
        },
      },
    },
  });

  return client.listTools();
}
