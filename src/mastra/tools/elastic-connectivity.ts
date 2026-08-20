import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import { getElasticsearchClient } from "../../lib/elasticsearch.js";
import {
  decisionAlias,
  memoryAlias,
  relationAlias,
} from "../../lib/memory-indices.js";

export const elasticConnectivityTool = createTool({
  id: "elastic-connectivity",
  description:
    "Checks the configured Elasticsearch connection and reports the Great Questions index counts.",
  inputSchema: z.object({}),
  outputSchema: z.object({
    connected: z.boolean(),
    indices: z.array(
      z.object({
        name: z.string(),
        exists: z.boolean(),
        count: z.number().int().nonnegative(),
      }),
    ),
  }),
  execute: async () => {
    const client = getElasticsearchClient();
    await client.ping();

    const indices = await Promise.all(
      [memoryAlias, relationAlias, decisionAlias].map(async (name) => {
        const exists = await client.indices.exists({ index: name });
        const count = exists ? (await client.count({ index: name })).count : 0;
        return { name, exists, count };
      }),
    );

    return { connected: true, indices };
  },
});
