import path from "node:path";

import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import {
  AGENTIC_MESH_DEFAULT_TRANSCRIPT_DIRECTORY,
  AgenticMeshBulkError,
  buildAgenticMeshIngestionPlan,
  executeAgenticMeshIngestion,
} from "../../lib/agentic-mesh-ingestion.js";
import { getElasticsearchClient } from "../../lib/elasticsearch.js";

const bulkFailureSchema = z.object({
  id: z.string(),
  reason: z.string(),
  status: z.number().int(),
  type: z.string(),
});

const ingestionPlanSchema = z.object({
  bulkOperation: z.object({
    actionLine: z.object({
      index: z.object({
        _id: z.literal("<memory_id>"),
        _index: z.string(),
      }),
    }),
    batchDocumentLimit: z.number().int().positive(),
    method: z.literal("POST"),
    path: z.literal("/_bulk?refresh=wait_for&require_alias=true"),
    refresh: z.literal("wait_for"),
    requestTimeoutMs: z.number().int().positive(),
    requireAlias: z.literal(true),
    sourceLineFields: z.array(z.string()),
    sourceObjectFields: z.array(z.string()),
  }),
  documentCount: z.number().int().positive(),
  episodeCount: z.number().int().positive(),
  episodes: z.array(
    z.object({
      documentCount: z.number().int().positive(),
      episodeId: z.string(),
      sourceTitle: z.string(),
      sourceUrl: z.url(),
    }),
  ),
  planHash: z.string().regex(/^sha256:[a-f0-9]{64}$/),
  targetAlias: z.string(),
});

const ingestionResultSchema = z.discriminatedUnion("status", [
  z.object({
    batchCount: z.number().int().positive(),
    documentCount: z.number().int().positive(),
    episodeCount: z.number().int().positive(),
    indexedDocumentCount: z.number().int().nonnegative(),
    planHash: z.string(),
    status: z.literal("indexed"),
    targetAlias: z.string(),
  }),
  z.object({
    attemptedDocumentCount: z.number().int().nonnegative(),
    batchNumber: z.number().int().positive(),
    documentCount: z.number().int().positive(),
    episodeCount: z.number().int().positive(),
    failures: z.array(bulkFailureSchema).min(1),
    indexedDocumentCount: z.number().int().nonnegative(),
    planHash: z.string(),
    status: z.literal("partial_failure"),
    targetAlias: z.string(),
  }),
]);

function transcriptDirectory(): string {
  return path.resolve(AGENTIC_MESH_DEFAULT_TRANSCRIPT_DIRECTORY);
}

export const agenticMeshIngestionPlanTool = createTool({
  id: "agentic-mesh-ingestion-plan",
  description:
    "Validates all local Agentic Mesh podcast transcripts and returns an exact, transcript-free Elasticsearch bulk ingestion preview and deterministic approval hash. This tool never writes.",
  inputSchema: z.object({}),
  outputSchema: ingestionPlanSchema,
  execute: async () =>
    buildAgenticMeshIngestionPlan(transcriptDirectory()),
});

export const agenticMeshIngestionWriteTool = createTool({
  id: "agentic-mesh-ingestion-write",
  description:
    "Writes the validated Agentic Mesh ingestion plan to Elasticsearch only when write=true and approvedPlanHash exactly matches a freshly recomputed plan. Run the plan tool first and obtain explicit user approval in a later message.",
  inputSchema: z.object({
    approvedPlanHash: z.string().regex(/^sha256:[a-f0-9]{64}$/),
    write: z.boolean().default(false),
  }),
  outputSchema: ingestionResultSchema,
  execute: async ({ approvedPlanHash, write }) => {
    try {
      return await executeAgenticMeshIngestion({
        approvedPlanHash,
        client: getElasticsearchClient,
        transcriptDirectory: transcriptDirectory(),
        write,
      });
    } catch (error) {
      if (!(error instanceof AgenticMeshBulkError)) throw error;

      return {
        attemptedDocumentCount: error.attemptedDocumentCount,
        batchNumber: error.batchNumber,
        documentCount: error.documentCount,
        episodeCount: error.episodeCount,
        failures: error.failures,
        indexedDocumentCount: error.indexedDocumentCount,
        planHash: error.planHash,
        status: "partial_failure" as const,
        targetAlias: error.targetAlias,
      };
    }
  },
});
