import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import type { estypes } from "@elastic/elasticsearch";

import {
  AGENTIC_MESH_BULK_REQUEST_TIMEOUT_MS,
  AGENTIC_MESH_TARGET_ALIAS,
  AgenticMeshBulkError,
  buildAgenticMeshIngestionPlan,
  executeAgenticMeshIngestion,
} from "../src/lib/agentic-mesh-ingestion.js";

const transcriptDirectory = path.join(
  fileURLToPath(new URL("../data/agentic-mesh/", import.meta.url)),
  "transcripts",
);
const hasLocalCorpus =
  process.env.SKIP_LOCAL_CORPUS_TESTS !== "1" &&
  existsSync(transcriptDirectory);
const localCorpusTestOptions = {
  skip: hasLocalCorpus
    ? false
    : "local Agentic Mesh transcripts are intentionally not published",
};

function fakeBulkResponse(
  itemCount: number,
): estypes.BulkResponse {
  return {
    errors: false,
    items: Array.from({ length: itemCount }, (_, index) => ({
      index: {
        _id: `memory-${index}`,
        _index: AGENTIC_MESH_TARGET_ALIAS,
        _primary_term: 1,
        _seq_no: index,
        _shards: { failed: 0, successful: 1, total: 1 },
        _version: 1,
        result: "created",
        status: 201,
      },
    })),
    took: 1,
  };
}

test("builds a stable transcript-free plan for all 19 episodes", localCorpusTestOptions, async () => {
  const first = await buildAgenticMeshIngestionPlan(transcriptDirectory);
  const second = await buildAgenticMeshIngestionPlan(transcriptDirectory);

  assert.deepEqual(first, second);
  assert.equal(first.targetAlias, "great-questions-memories");
  assert.equal(first.episodeCount, 19);
  assert.equal(first.documentCount, 420);
  assert.match(first.planHash, /^sha256:[a-f0-9]{64}$/);
  assert.deepEqual(first.bulkOperation.actionLine, {
    index: {
      _id: "<memory_id>",
      _index: "great-questions-memories",
    },
  });
  assert.equal(
    first.bulkOperation.path,
    "/_bulk?refresh=wait_for&require_alias=true",
  );
  assert.equal(first.bulkOperation.requestTimeoutMs, 300_000);
  assert.equal(first.bulkOperation.requireAlias, true);
  assert.equal(
    first.episodes.reduce(
      (count, episode) => count + episode.documentCount,
      0,
    ),
    420,
  );
  assert.equal("documents" in first, false);
  assert.equal("statement" in first, false);
});

test("rejects missing write approval before making a bulk call", localCorpusTestOptions, async () => {
  let bulkCalls = 0;
  const client = {
    bulk: async () => {
      bulkCalls += 1;
      return fakeBulkResponse(0);
    },
  };
  const plan = await buildAgenticMeshIngestionPlan(transcriptDirectory);

  await assert.rejects(
    executeAgenticMeshIngestion({
      approvedPlanHash: plan.planHash,
      client,
      transcriptDirectory,
      write: false,
    }),
    /write=true/,
  );
  assert.equal(bulkCalls, 0);
});

test("rejects a stale or incorrect plan hash before making a bulk call", localCorpusTestOptions, async () => {
  let bulkCalls = 0;
  const client = {
    bulk: async () => {
      bulkCalls += 1;
      return fakeBulkResponse(0);
    },
  };

  await assert.rejects(
    executeAgenticMeshIngestion({
      approvedPlanHash: `sha256:${"0".repeat(64)}`,
      client,
      transcriptDirectory,
      write: true,
    }),
    /does not match/,
  );
  assert.equal(bulkCalls, 0);
});

test("uses guarded alias bulk writes after exact approval", localCorpusTestOptions, async () => {
  const calls: Array<{
    operations: estypes.BulkRequest["operations"];
    refresh?: estypes.BulkRequest["refresh"];
    requestTimeout?: number | string;
    requireAlias?: boolean;
  }> = [];
  const client = {
    bulk: async (
      request: estypes.BulkRequest,
      options?: { requestTimeout?: number | string },
    ) => {
      calls.push({
        operations: request.operations,
        refresh: request.refresh,
        requestTimeout: options?.requestTimeout,
        requireAlias: request.require_alias,
      });
      return fakeBulkResponse((request.operations?.length ?? 0) / 2);
    },
  };
  const plan = await buildAgenticMeshIngestionPlan(transcriptDirectory);

  const result = await executeAgenticMeshIngestion({
    approvedPlanHash: plan.planHash,
    client,
    ingestedAt: "2026-08-19T22:00:00.000Z",
    transcriptDirectory,
    write: true,
  });

  assert.equal(result.status, "indexed");
  assert.equal(result.indexedDocumentCount, 420);
  assert.equal(calls.length, 2);
  assert.ok(
    calls.every(
      (call) =>
        call.refresh === "wait_for" &&
        call.requireAlias === true &&
        call.requestTimeout === AGENTIC_MESH_BULK_REQUEST_TIMEOUT_MS,
    ),
  );
  const firstAction = calls[0]?.operations?.[0] as
    | { index?: { _id?: string; _index?: string } }
    | undefined;
  assert.equal(firstAction?.index?._index, AGENTIC_MESH_TARGET_ALIAS);
  assert.ok(firstAction?.index?._id?.startsWith("agentic-mesh:"));
});

test("surfaces item-level partial failures without transcript text", localCorpusTestOptions, async () => {
  const plan = await buildAgenticMeshIngestionPlan(transcriptDirectory);
  const client = {
    bulk: async (
      request: estypes.BulkRequest,
    ): Promise<estypes.BulkResponse> => {
      const response = fakeBulkResponse(
        (request.operations?.length ?? 0) / 2,
      );
      response.errors = true;
      response.items[0] = {
        index: {
          _id: "agentic-mesh:synthetic-failed-id",
          _index: AGENTIC_MESH_TARGET_ALIAS,
          error: {
            reason: "synthetic strict-mapping rejection",
            type: "strict_dynamic_mapping_exception",
          },
          status: 400,
        },
      };
      return response;
    },
  };

  await assert.rejects(
    executeAgenticMeshIngestion({
      approvedPlanHash: plan.planHash,
      client,
      ingestedAt: "2026-08-19T22:00:00.000Z",
      transcriptDirectory,
      write: true,
    }),
    (error: unknown) => {
      assert.ok(error instanceof AgenticMeshBulkError);
      assert.equal(error.batchNumber, 1);
      assert.equal(error.attemptedDocumentCount, 250);
      assert.equal(error.indexedDocumentCount, 249);
      assert.deepEqual(error.failures, [
        {
          id: "agentic-mesh:synthetic-failed-id",
          reason: "synthetic strict-mapping rejection",
          status: 400,
          type: "strict_dynamic_mapping_exception",
        },
      ]);
      assert.equal("statement" in error, false);
      return true;
    },
  );
});
