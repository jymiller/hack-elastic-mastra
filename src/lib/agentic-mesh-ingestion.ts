import { createHash } from "node:crypto";
import path from "node:path";

import type { estypes } from "@elastic/elasticsearch";

import {
  listAgenticMeshTranscriptFiles,
  loadAgenticMeshMemoryDocuments,
} from "./agentic-mesh-corpus.js";
import { memoryAlias } from "./memory-indices.js";
import type { PodcastMemoryDocument } from "./podcast-corpus.js";

export const AGENTIC_MESH_DEFAULT_TRANSCRIPT_DIRECTORY =
  "data/agentic-mesh/transcripts";
export const AGENTIC_MESH_TARGET_ALIAS = memoryAlias;
export const AGENTIC_MESH_BULK_DOCUMENTS_PER_REQUEST = 250;
export const AGENTIC_MESH_BULK_REQUEST_TIMEOUT_MS = 300_000;

const PLAN_INGESTED_AT = "2000-01-01T00:00:00.000Z";
const PLAN_FORMAT_VERSION = 1;

export interface AgenticMeshEpisodePlan {
  documentCount: number;
  episodeId: string;
  sourceTitle: string;
  sourceUrl: string;
}

export interface AgenticMeshIngestionPlan {
  bulkOperation: {
    actionLine: {
      index: {
        _id: "<memory_id>";
        _index: string;
      };
    };
    batchDocumentLimit: number;
    method: "POST";
    path: "/_bulk?refresh=wait_for&require_alias=true";
    refresh: "wait_for";
    requestTimeoutMs: number;
    requireAlias: true;
    sourceLineFields: string[];
    sourceObjectFields: string[];
  };
  documentCount: number;
  episodeCount: number;
  episodes: AgenticMeshEpisodePlan[];
  planHash: string;
  targetAlias: string;
}

interface PreparedAgenticMeshIngestion {
  documents: PodcastMemoryDocument[];
  plan: AgenticMeshIngestionPlan;
}

export interface AgenticMeshBulkFailure {
  id: string;
  reason: string;
  status: number;
  type: string;
}

export interface AgenticMeshIngestionSuccess {
  batchCount: number;
  documentCount: number;
  episodeCount: number;
  indexedDocumentCount: number;
  planHash: string;
  status: "indexed";
  targetAlias: string;
}

export interface ExecuteAgenticMeshIngestionOptions {
  approvedPlanHash: string;
  client:
    | AgenticMeshBulkClient
    | (() => AgenticMeshBulkClient);
  ingestedAt?: string;
  transcriptDirectory?: string;
  write: boolean;
}

export interface AgenticMeshBulkClient {
  bulk(
    request: estypes.BulkRequest,
    options: { requestTimeout: number },
  ): Promise<estypes.BulkResponse>;
}

export class AgenticMeshBulkError extends Error {
  readonly attemptedDocumentCount: number;
  readonly batchNumber: number;
  readonly documentCount: number;
  readonly episodeCount: number;
  readonly failures: AgenticMeshBulkFailure[];
  readonly indexedDocumentCount: number;
  readonly planHash: string;
  readonly targetAlias: string;

  constructor(options: {
    attemptedDocumentCount: number;
    batchNumber: number;
    documentCount: number;
    episodeCount: number;
    failures: AgenticMeshBulkFailure[];
    indexedDocumentCount: number;
    planHash: string;
    targetAlias: string;
  }) {
    super(
      `Elasticsearch partially rejected Agentic Mesh ingestion batch ${options.batchNumber}: ${options.failures.length} failed operation(s).`,
    );
    this.name = "AgenticMeshBulkError";
    this.attemptedDocumentCount = options.attemptedDocumentCount;
    this.batchNumber = options.batchNumber;
    this.documentCount = options.documentCount;
    this.episodeCount = options.episodeCount;
    this.failures = options.failures;
    this.indexedDocumentCount = options.indexedDocumentCount;
    this.planHash = options.planHash;
    this.targetAlias = options.targetAlias;
  }
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }

  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;
    const properties = Object.keys(record)
      .sort()
      .map(
        (key) =>
          `${JSON.stringify(key)}:${canonicalJson(record[key])}`,
      );
    return `{${properties.join(",")}}`;
  }

  return JSON.stringify(value);
}

function planHash(documents: readonly PodcastMemoryDocument[]): string {
  const normalizedDocuments = documents.map((document) => ({
    ...document,
    ingested_at: "<write-time>",
  }));
  const digest = createHash("sha256")
    .update(
      canonicalJson({
        documents: normalizedDocuments,
        formatVersion: PLAN_FORMAT_VERSION,
        targetAlias: AGENTIC_MESH_TARGET_ALIAS,
      }),
    )
    .digest("hex");

  return `sha256:${digest}`;
}

function episodePlans(
  documents: readonly PodcastMemoryDocument[],
): AgenticMeshEpisodePlan[] {
  const episodes = new Map<string, AgenticMeshEpisodePlan>();

  for (const document of documents) {
    const current = episodes.get(document.source.episode_id);
    if (current) {
      current.documentCount += 1;
      continue;
    }

    episodes.set(document.source.episode_id, {
      documentCount: 1,
      episodeId: document.source.episode_id,
      sourceTitle: document.source.title,
      sourceUrl: document.source.url,
    });
  }

  return [...episodes.values()].sort((left, right) =>
    left.episodeId.localeCompare(right.episodeId),
  );
}

async function prepareAgenticMeshIngestion(
  transcriptDirectory: string,
): Promise<PreparedAgenticMeshIngestion> {
  const transcriptPaths = await listAgenticMeshTranscriptFiles(
    transcriptDirectory,
  );
  if (transcriptPaths.length === 0) {
    throw new Error(
      `No Agentic Mesh transcript .txt files found in ${transcriptDirectory}.`,
    );
  }

  const documents = (
    await Promise.all(
      transcriptPaths.map((transcriptPath) =>
        loadAgenticMeshMemoryDocuments(
          transcriptPath,
          PLAN_INGESTED_AT,
        ),
      ),
    )
  )
    .flat()
    .sort((left, right) => left.memory_id.localeCompare(right.memory_id));

  if (documents.length === 0) {
    throw new Error("Agentic Mesh transcripts produced no memory documents.");
  }

  const memoryIds = new Set(documents.map((document) => document.memory_id));
  if (memoryIds.size !== documents.length) {
    throw new Error(
      "Agentic Mesh ingestion plan contains duplicate memory document IDs.",
    );
  }

  const episodes = episodePlans(documents);
  const topLevelFields = Object.keys(documents[0] ?? {}).sort();
  const sourceFields = Object.keys(documents[0]?.source ?? {}).sort();

  return {
    documents,
    plan: {
      bulkOperation: {
        actionLine: {
          index: {
            _id: "<memory_id>",
            _index: AGENTIC_MESH_TARGET_ALIAS,
          },
        },
        batchDocumentLimit: AGENTIC_MESH_BULK_DOCUMENTS_PER_REQUEST,
        method: "POST",
        path: "/_bulk?refresh=wait_for&require_alias=true",
        refresh: "wait_for",
        requestTimeoutMs: AGENTIC_MESH_BULK_REQUEST_TIMEOUT_MS,
        requireAlias: true,
        sourceLineFields: topLevelFields,
        sourceObjectFields: sourceFields,
      },
      documentCount: documents.length,
      episodeCount: episodes.length,
      episodes,
      planHash: planHash(documents),
      targetAlias: AGENTIC_MESH_TARGET_ALIAS,
    },
  };
}

export async function buildAgenticMeshIngestionPlan(
  transcriptDirectory = path.resolve(
    AGENTIC_MESH_DEFAULT_TRANSCRIPT_DIRECTORY,
  ),
): Promise<AgenticMeshIngestionPlan> {
  return (await prepareAgenticMeshIngestion(transcriptDirectory)).plan;
}

function bulkFailures(
  response: estypes.BulkResponse,
): AgenticMeshBulkFailure[] {
  return response.items.flatMap((item) => {
    const result = item.index ?? item.create ?? item.update ?? item.delete;
    if (!result?.error) return [];

    return [
      {
        id: result._id ?? "<unknown>",
        reason: result.error.reason ?? "unknown reason",
        status: result.status,
        type: result.error.type,
      },
    ];
  });
}

export async function executeAgenticMeshIngestion(
  options: ExecuteAgenticMeshIngestionOptions,
): Promise<AgenticMeshIngestionSuccess> {
  const transcriptDirectory =
    options.transcriptDirectory ??
    path.resolve(AGENTIC_MESH_DEFAULT_TRANSCRIPT_DIRECTORY);
  const prepared = await prepareAgenticMeshIngestion(transcriptDirectory);

  if (options.write !== true) {
    throw new Error(
      "Agentic Mesh ingestion is plan-only unless write=true is explicitly supplied.",
    );
  }

  if (options.approvedPlanHash !== prepared.plan.planHash) {
    throw new Error(
      `Approved plan hash does not match the current Agentic Mesh ingestion plan. Current plan hash: ${prepared.plan.planHash}`,
    );
  }

  const ingestedAt = options.ingestedAt ?? new Date().toISOString();
  if (Number.isNaN(Date.parse(ingestedAt))) {
    throw new Error("ingestedAt must be a valid ISO timestamp.");
  }

  let indexedDocumentCount = 0;
  let batchCount = 0;
  const client =
    typeof options.client === "function"
      ? options.client()
      : options.client;

  for (
    let offset = 0;
    offset < prepared.documents.length;
    offset += AGENTIC_MESH_BULK_DOCUMENTS_PER_REQUEST
  ) {
    const batch = prepared.documents.slice(
      offset,
      offset + AGENTIC_MESH_BULK_DOCUMENTS_PER_REQUEST,
    );
    const operations: estypes.BulkRequest["operations"] = [];

    for (const plannedDocument of batch) {
      const document = {
        ...plannedDocument,
        ingested_at: ingestedAt,
      };
      operations.push(
        {
          index: {
            _id: document.memory_id,
            _index: AGENTIC_MESH_TARGET_ALIAS,
          },
        },
        document,
      );
    }

    batchCount += 1;
    const response = await client.bulk(
      {
        operations,
        refresh: "wait_for",
        require_alias: true,
      },
      {
        requestTimeout: AGENTIC_MESH_BULK_REQUEST_TIMEOUT_MS,
      },
    );

    if (response.errors) {
      const failures = bulkFailures(response);
      throw new AgenticMeshBulkError({
        attemptedDocumentCount: offset + batch.length,
        batchNumber: batchCount,
        documentCount: prepared.plan.documentCount,
        episodeCount: prepared.plan.episodeCount,
        failures:
          failures.length > 0
            ? failures
            : [
                {
                  id: "<unknown>",
                  reason:
                    "Bulk response reported errors without an item-level error.",
                  status: 500,
                  type: "unknown_bulk_error",
                },
              ],
        indexedDocumentCount:
          failures.length > 0
            ? indexedDocumentCount + batch.length - failures.length
            : indexedDocumentCount,
        planHash: prepared.plan.planHash,
        targetAlias: prepared.plan.targetAlias,
      });
    }

    indexedDocumentCount += batch.length;
  }

  return {
    batchCount,
    documentCount: prepared.plan.documentCount,
    episodeCount: prepared.plan.episodeCount,
    indexedDocumentCount,
    planHash: prepared.plan.planHash,
    status: "indexed",
    targetAlias: prepared.plan.targetAlias,
  };
}
