import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  buildAgenticMeshMemoryDocuments,
  listAgenticMeshTranscriptFiles,
  loadAgenticMeshMemoryDocuments,
  parseAgenticMeshEpisodeMetadata,
  parseAgenticMeshTranscriptFileName,
} from "../src/lib/agentic-mesh-corpus.js";

const corpusRoot = fileURLToPath(
  new URL("../data/agentic-mesh/", import.meta.url),
);
const localTranscriptDirectory = path.join(corpusRoot, "transcripts");
const hasLocalCorpus =
  process.env.SKIP_LOCAL_CORPUS_TESTS !== "1" &&
  existsSync(localTranscriptDirectory);

function episodeRecord(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    episode_number: 7,
    guests: ["Guest Person", "Eric Broda"],
    hosts: ["Eric Broda", "John Miller", "Eric Broda"],
    platform_urls: {
      youtube: "https://www.youtube.com/watch?v=IMsg_GHW8m4",
    },
    published_at: "2026-02-03T19:43:53Z",
    title: "A Synthetic Episode Title",
    transcript: {
      files: [
        "transcripts/episode-07-IMsg_GHW8m4-youtube-auto.txt",
        "transcripts/episode-07-youtube-auto.en.json3",
      ],
    },
    youtube: { video_id: "IMsg_GHW8m4" },
    ...overrides,
  };
}

test("parses Agentic Mesh transcript filenames", () => {
  assert.deepEqual(
    parseAgenticMeshTranscriptFileName(
      "episode-07-IMsg_GHW8m4-youtube-auto.txt",
    ),
    {
      baseName: "episode-07-IMsg_GHW8m4-youtube-auto",
      episodeLabel: "07",
      episodeNumber: 7,
      fileName: "episode-07-IMsg_GHW8m4-youtube-auto.txt",
      videoId: "IMsg_GHW8m4",
    },
  );

  assert.throws(
    () =>
      parseAgenticMeshTranscriptFileName(
        "episode-7-IMsg_GHW8m4-youtube-auto.txt",
      ),
    /must match/,
  );
  assert.throws(
    () =>
      parseAgenticMeshTranscriptFileName(
        "episode-00-IMsg_GHW8m4-youtube-auto.txt",
      ),
    /invalid episode number/,
  );
});

test("validates episode metadata and preserves its full publication timestamp", () => {
  const episode = parseAgenticMeshEpisodeMetadata(episodeRecord());

  assert.equal(episode.episodeNumber, 7);
  assert.equal(episode.videoId, "IMsg_GHW8m4");
  assert.equal(episode.publishedAt, "2026-02-03T19:43:53Z");
  assert.deepEqual(episode.hosts, ["Eric Broda", "John Miller"]);
  assert.deepEqual(episode.guests, ["Guest Person", "Eric Broda"]);

  assert.throws(
    () =>
      parseAgenticMeshEpisodeMetadata(
        episodeRecord({ published_at: "2026-02-03" }),
      ),
    /full ISO timestamp/,
  );
  assert.throws(
    () =>
      parseAgenticMeshEpisodeMetadata({
        ...episodeRecord(),
        platform_urls: {
          youtube: "https://www.youtube.com/watch?v=d5jc2WiWn4M",
        },
      }),
    /must identify its youtube.video_id/,
  );
});

test("builds deterministic strict-mapping-compatible Agentic Mesh memories", () => {
  const fileMetadata = parseAgenticMeshTranscriptFileName(
    "episode-07-IMsg_GHW8m4-youtube-auto.txt",
  );
  const episode = parseAgenticMeshEpisodeMetadata(episodeRecord());
  const options = {
    chunkCharacters: 500,
    episode,
    fileMetadata,
    ingestedAt: "2026-08-19T20:00:00.000Z",
    overlapCharacters: 50,
    transcript: `
Agentic Mesh transcript
Video ID: IMsg_GHW8m4
Language: en
Captions: auto-generated

[0:19] A synthetic first caption for a deterministic test.
[0:30] A synthetic second caption for a deterministic test.
    `,
  } as const;

  const first = buildAgenticMeshMemoryDocuments(options);
  const second = buildAgenticMeshMemoryDocuments(options);

  assert.equal(first.length, 1);
  assert.equal(first[0]?.memory_id, second[0]?.memory_id);
  assert.match(
    first[0]?.memory_id ?? "",
    /^agentic-mesh:IMsg_GHW8m4:[a-f0-9]{24}$/,
  );
  assert.deepEqual(Object.keys(first[0] ?? {}).sort(), [
    "context",
    "ingested_at",
    "is_current",
    "memory_id",
    "memory_type",
    "observed_at",
    "people",
    "source",
    "statement",
    "status",
    "subject",
    "subject_id",
    "topics",
    "valid_from",
  ]);
  assert.deepEqual(Object.keys(first[0]?.source ?? {}).sort(), [
    "episode_id",
    "locator",
    "published_at",
    "title",
    "url",
  ]);
  assert.deepEqual(first[0]?.people, [
    "Eric Broda",
    "John Miller",
    "Guest Person",
  ]);
  assert.deepEqual(first[0]?.topics, ["podcast", "agentic-mesh"]);
  assert.equal(first[0]?.observed_at, "2026-02-03T19:43:53Z");
  assert.equal(first[0]?.valid_from, "2026-02-03T19:43:53Z");
  assert.equal(first[0]?.source.published_at, "2026-02-03T19:43:53Z");
  assert.equal(first[0]?.source.title, "A Synthetic Episode Title");
  assert.equal(
    first[0]?.source.url,
    "https://www.youtube.com/watch?v=IMsg_GHW8m4",
  );
  assert.equal(
    first[0]?.source.episode_id,
    "agentic-mesh:episode-07",
  );
  assert.equal(first[0]?.source.locator, "Transcript 0:19-0:30 (chunk 1)");
});

test("rejects filename, metadata, and transcript-header provenance conflicts", () => {
  const fileMetadata = parseAgenticMeshTranscriptFileName(
    "episode-07-IMsg_GHW8m4-youtube-auto.txt",
  );
  const baseOptions = {
    episode: parseAgenticMeshEpisodeMetadata(episodeRecord()),
    fileMetadata,
    ingestedAt: "2026-08-19T20:00:00.000Z",
    transcript: "Video ID: IMsg_GHW8m4\n[0:00] Synthetic caption.",
  } as const;

  assert.throws(
    () =>
      buildAgenticMeshMemoryDocuments({
        ...baseOptions,
        episode: parseAgenticMeshEpisodeMetadata(
          episodeRecord({ episode_number: 8 }),
        ),
      }),
    /episode number does not match/,
  );
  assert.throws(
    () =>
      buildAgenticMeshMemoryDocuments({
        ...baseOptions,
        episode: parseAgenticMeshEpisodeMetadata({
          ...episodeRecord(),
          platform_urls: {
            youtube: "https://www.youtube.com/watch?v=d5jc2WiWn4M",
          },
          youtube: { video_id: "d5jc2WiWn4M" },
        }),
      }),
    /metadata video ID does not match/,
  );
  assert.throws(
    () =>
      buildAgenticMeshMemoryDocuments({
        ...baseOptions,
        transcript: "Video ID: d5jc2WiWn4M\n[0:00] Synthetic caption.",
      }),
    /header video ID does not match/,
  );
  assert.throws(
    () =>
      buildAgenticMeshMemoryDocuments({
        ...baseOptions,
        transcript: "[0:00] Synthetic caption without a header.",
      }),
    /exactly one Video ID header/,
  );
});

test(
  "loads all recovered local episodes without external services",
  {
    skip: hasLocalCorpus
      ? false
      : "local Agentic Mesh transcripts are intentionally not published",
  },
  async () => {
  const transcriptFiles = await listAgenticMeshTranscriptFiles(
    localTranscriptDirectory,
  );
  assert.equal(transcriptFiles.length, 19);

  const documentsByEpisode = await Promise.all(
    transcriptFiles.map((transcriptPath) =>
      loadAgenticMeshMemoryDocuments(
        transcriptPath,
        "2026-08-19T20:00:00.000Z",
      ),
    ),
  );
  const documents = documentsByEpisode.flat();

  assert.equal(documents.length, 420);
  assert.ok(
    documentsByEpisode.every(
      (episodeDocuments) => episodeDocuments.length > 0,
    ),
  );
  assert.equal(
    new Set(documents.map((document) => document.memory_id)).size,
    documents.length,
  );
  assert.ok(
    documents.every(
      (document) =>
        document.topics[0] === "podcast" &&
        document.topics[1] === "agentic-mesh" &&
        document.people.length >= 1,
    ),
  );
  },
);
