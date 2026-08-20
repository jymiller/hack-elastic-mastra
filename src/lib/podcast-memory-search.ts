import type { Client, estypes } from "@elastic/elasticsearch";

import { memoryAlias } from "./memory-indices.js";
import type { PodcastMemoryDocument } from "./podcast-corpus.js";

export interface PodcastMemoryHit {
  memory_id: string;
  text: string;
  people: string[];
  source: {
    title: string;
    url: string;
    image_url?: string;
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
  "people",
  "source.title",
  "source.url",
  "source.published_at",
  "source.locator",
] as const;

function timestampToSeconds(timestamp: string): number | undefined {
  const parts = timestamp.split(":").map(Number);
  if (
    (parts.length !== 2 && parts.length !== 3) ||
    parts.some((part) => !Number.isInteger(part) || part < 0)
  ) {
    return undefined;
  }

  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return seconds < 60 ? minutes * 60 + seconds : undefined;
  }

  const [hours, minutes, seconds] = parts;
  return minutes < 60 && seconds < 60
    ? hours * 3600 + minutes * 60 + seconds
    : undefined;
}

export function timestampedPodcastUrl(url: string, locator: string): string {
  const startTimestamp = /^Transcript\s+(\d+(?::\d{1,2})?:\d{2})/.exec(
    locator,
  )?.[1];
  const startSeconds = startTimestamp
    ? timestampToSeconds(startTimestamp)
    : undefined;

  if (startSeconds === undefined) return url;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const isYoutube =
      host === "youtu.be" ||
      host === "youtube.com" ||
      host.endsWith(".youtube.com");

    if (!isYoutube) return url;

    parsed.searchParams.set("t", `${startSeconds}s`);
    return parsed.toString();
  } catch {
    return url;
  }
}

export function youtubeThumbnailUrl(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const videoId =
      host === "youtu.be"
        ? parsed.pathname.split("/").filter(Boolean)[0]
        : host === "youtube.com" || host.endsWith(".youtube.com")
          ? parsed.searchParams.get("v") ?? undefined
          : undefined;

    return videoId && /^[A-Za-z0-9_-]{6,20}$/.test(videoId)
      ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
      : undefined;
  } catch {
    return undefined;
  }
}

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
        people: document.people ?? [],
        source: {
          title: document.source.title,
          url: timestampedPodcastUrl(
            document.source.url,
            document.source.locator,
          ),
          image_url: youtubeThumbnailUrl(document.source.url),
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
