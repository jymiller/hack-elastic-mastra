import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import { getElasticsearchClient } from "../../lib/elasticsearch.js";
import { searchPodcastMemory } from "../../lib/podcast-memory-search.js";

export const podcastMemorySearchTool = createTool({
  id: "podcast-memory-search",
  description:
    "Searches dated podcast transcript memories and returns concise, citable source excerpts. Use it to recover historical statements and compare ideas across episodes.",
  inputSchema: z.object({
    query: z.string().trim().min(2).max(500),
    limit: z.number().int().min(1).max(10).default(5),
  }),
  outputSchema: z.object({
    strategy: z.enum(["hybrid", "lexical"]),
    hits: z.array(
      z.object({
        memory_id: z.string(),
        text: z.string(),
        people: z.array(z.string()),
        source: z.object({
          title: z.string(),
          url: z.string(),
          image_url: z.string().url().optional(),
          date: z.string(),
          locator: z.string(),
        }),
        score: z.number(),
      }),
    ),
  }),
  execute: async ({ query, limit }) =>
    searchPodcastMemory(
      getElasticsearchClient(),
      query,
      limit,
    ),
});
