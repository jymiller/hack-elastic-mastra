import type { Client, estypes } from "@elastic/elasticsearch";

import { memoryAlias } from "./memory-indices.js";
import type { PodcastMemoryDocument } from "./podcast-corpus.js";

export interface PodcastMemoryHit {
  memory_id: string;
  text: string;
  source: {
    title: string;
    url: string;
    date: string;
    locator: string;
  };
  score: number;
}

export interface PodcastMemorySearchResult {
  strategy: "hybrid" | "lexical";
  hits: PodcastMemoryHit[];
}

const sourceFields = [
  "memory_id",
  "statement",
  "source.title",
  "source.url",
  "source.published_at",
  "source.locator",
] as const;

function lexicalQuery(query: string): estypes.QueryDslQueryContainer {
  return {
    multi_match: {
      query,
      fields: ["statement^4", "context^2", "subject^2", "source.title^2"],
      type: "best_fields",
    },
  };
}

export function podcastHybridSearchRequest(
  query: string,
  limit: number,
): estypes.SearchRequest {
  return {
    index: memoryAlias,
    size: limit,
    _source: [...sourceFields],
    retriever: {
      rrf: {
        filter: { term: { memory_type: "transcript_chunk" } },
        retrievers: [
          { standard: { query: lexicalQuery(query) } },
          {
            standard: {
              query: {
                semantic: {
                  field: "semantic_content",
                  query,
                },
              },
            },
          },
        ],
        rank_constant: 20,
        rank_window_size: Math.max(20, limit * 4),
      },
    },
  };
}

export function podcastLexicalSearchRequest(
  query: string,
  limit: number,
): estypes.SearchRequest {
  return {
    index: memoryAlias,
    size: limit,
    _source: [...sourceFields],
    query: {
      bool: {
        filter: [{ term: { memory_type: "transcript_chunk" } }],
        must: [lexicalQuery(query)],
      },
    },
  };
}

function mapPodcastHits(
  response: estypes.SearchResponse<PodcastMemoryDocument>,
): PodcastMemoryHit[] {
  return response.hits.hits.flatMap((hit) => {
    const document = hit._source;
    if (
      !document?.memory_id ||
      !document.statement ||
      !document.source?.title ||
      !document.source.url ||
      !document.source.published_at ||
      !document.source.locator
    ) {
      return [];
    }

    return [
      {
        memory_id: document.memory_id,
        text: document.statement,
        source: {
          title: document.source.title,
          url: document.source.url,
          date: document.source.published_at,
          locator: document.source.locator,
        },
        score: hit._score ?? 0,
      },
    ];
  });
}

export async function searchPodcastMemory(
  client: Client,
  query: string,
  limit: number,
): Promise<PodcastMemorySearchResult> {
  try {
    const response = await client.search<PodcastMemoryDocument>(
      podcastHybridSearchRequest(query, limit),
    );
    return { strategy: "hybrid", hits: mapPodcastHits(response) };
  } catch {
    // `semantic_text` depends on the deployment's inference configuration and
    // RRF availability. Lexical search keeps this tool useful on deployments
    // where either capability has not been enabled yet.
    try {
      const response = await client.search<PodcastMemoryDocument>(
        podcastLexicalSearchRequest(query, limit),
      );
      return { strategy: "lexical", hits: mapPodcastHits(response) };
    } catch (error) {
      throw new Error("Podcast memory search failed.", { cause: error });
    }
  }
}
