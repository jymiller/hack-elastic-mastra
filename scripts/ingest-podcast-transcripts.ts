import path from "node:path";

import type { estypes } from "@elastic/elasticsearch";

import { getElasticsearchClient } from "../src/lib/elasticsearch.js";
import { optionalEnv } from "../src/lib/env.js";
import {
  memoryAlias,
  memoryIndex,
} from "../src/lib/memory-indices.js";
import {
  listPodcastTranscriptFiles,
  loadPodcastMemoryDocuments,
  type PodcastMemoryDocument,
} from "../src/lib/podcast-corpus.js";

const DEFAULT_TRANSCRIPT_DIRECTORY = "data/dama-la/transcripts";
const BULK_DOCUMENTS_PER_REQUEST = 250;

function bulkFailureSummary(response: estypes.BulkResponse): string[] {
  return response.items.flatMap((item) => {
    const result = item.index ?? item.create ?? item.update ?? item.delete;
    if (!result?.error) return [];

    return [
      `${result.status} ${result.error.type}: ${result.error.reason ?? "unknown reason"}`,
    ];
  });
}

async function bulkIndexPodcastDocuments(
  documents: readonly PodcastMemoryDocument[],
): Promise<void> {
  const client = getElasticsearchClient();

  for (
    let offset = 0;
    offset < documents.length;
    offset += BULK_DOCUMENTS_PER_REQUEST
  ) {
    const batch = documents.slice(
      offset,
      offset + BULK_DOCUMENTS_PER_REQUEST,
    );
    const operations: estypes.BulkRequest["operations"] = [];

    for (const document of batch) {
      operations.push(
        { index: { _index: memoryAlias, _id: document.memory_id } },
        document,
      );
    }

    const response = await client.bulk(
      {
        operations,
        refresh: "wait_for",
      },
      {
        // The first semantic_text write can wait for the managed inference
        // endpoint to warm up.
        requestTimeout: 300_000,
      },
    );

    if (response.errors) {
      const failures = bulkFailureSummary(response);
      const sample = failures.slice(0, 5).join("; ");
      throw new Error(
        `Elasticsearch rejected ${failures.length} transcript chunks${
          sample ? `: ${sample}` : "."
        }`,
      );
    }
  }
}

async function main(): Promise<void> {
  const transcriptDirectory = path.resolve(
    optionalEnv("PODCAST_TRANSCRIPT_DIR") ?? DEFAULT_TRANSCRIPT_DIRECTORY,
  );
  const transcriptPaths = await listPodcastTranscriptFiles(
    transcriptDirectory,
  );

  if (transcriptPaths.length === 0) {
    throw new Error(
      `No transcript .txt files found in ${transcriptDirectory}.`,
    );
  }

  const client = getElasticsearchClient();
  const indexExists = await client.indices.exists({ index: memoryIndex });
  if (!indexExists) {
    throw new Error(
      `Memory index ${memoryIndex} does not exist. Run the Elasticsearch setup script first.`,
    );
  }

  const ingestedAt = new Date().toISOString();
  const documents = (
    await Promise.all(
      transcriptPaths.map((transcriptPath) =>
        loadPodcastMemoryDocuments(transcriptPath, ingestedAt),
      ),
    )
  ).flat();

  await bulkIndexPodcastDocuments(documents);

  console.log(
    `Indexed ${documents.length} transcript chunks from ${transcriptPaths.length} files into ${memoryAlias}.`,
  );
}

try {
  await main();
} catch (error) {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`Podcast transcript ingestion failed: ${message}`);
  process.exitCode = 1;
}
