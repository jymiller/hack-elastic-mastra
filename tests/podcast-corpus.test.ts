import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPodcastMemoryDocuments,
  chunkTranscriptSegments,
  parseTimestamp,
  parseTimestampedTranscript,
  parseTranscriptFileName,
  resolvePodcastSource,
} from "../src/lib/podcast-corpus.js";

test("parses stable date, video, and speaker metadata from transcript filenames", () => {
  assert.deepEqual(
    parseTranscriptFileName(
      "2026-04-25_eqWQGLgj5Ts_aaron-ansari.txt",
    ),
    {
      baseName: "2026-04-25_eqWQGLgj5Ts_aaron-ansari",
      date: "2026-04-25",
      publishedAt: "2026-04-25T00:00:00.000Z",
      speaker: "Aaron Ansari",
      speakerSlug: "aaron-ansari",
      videoId: "eqWQGLgj5Ts",
    },
  );

  assert.throws(
    () => parseTranscriptFileName("2026-02-30_eqWQGLgj5Ts_guest.txt"),
    /invalid date/,
  );
  assert.throws(
    () => parseTranscriptFileName("episode-01.txt"),
    /must match/,
  );
});

test("parses timestamped caption lines and joins wrapped text", () => {
  const segments = parseTimestampedTranscript(`
YouTube transcript
Video ID: eqWQGLgj5Ts

[0:19] The first caption wraps onto the
next line.
[1:02] The second caption.
[1:01:03] An hour-long timestamp.
  `);

  assert.deepEqual(segments, [
    {
      startSeconds: 19,
      timestamp: "0:19",
      text: "The first caption wraps onto the next line.",
    },
    {
      startSeconds: 62,
      timestamp: "1:02",
      text: "The second caption.",
    },
    {
      startSeconds: 3_663,
      timestamp: "1:01:03",
      text: "An hour-long timestamp.",
    },
  ]);
  assert.equal(parseTimestamp("62:03"), 3_723);
});

test("chunks on caption boundaries with deterministic overlap", () => {
  const chunks = chunkTranscriptSegments(
    [
      { startSeconds: 0, timestamp: "0:00", text: "alpha-one" },
      { startSeconds: 10, timestamp: "0:10", text: "beta-two" },
      { startSeconds: 20, timestamp: "0:20", text: "gamma-three" },
      { startSeconds: 30, timestamp: "0:30", text: "delta-four" },
    ],
    { chunkCharacters: 25, overlapCharacters: 8 },
  );

  assert.equal(chunks.length, 3);
  assert.equal(chunks[0]?.text, "alpha-one beta-two");
  assert.equal(chunks[1]?.text, "beta-two gamma-three");
  assert.equal(chunks[2]?.text, "gamma-three delta-four");
  assert.equal(chunks[0]?.endSeconds, chunks[1]?.startSeconds);
  assert.equal(chunks[1]?.endSeconds, chunks[2]?.startSeconds);
});

test("builds deterministic strict-mapping-compatible podcast memories", () => {
  const metadata = parseTranscriptFileName(
    "2026-04-25_eqWQGLgj5Ts_aaron-ansari.txt",
  );
  const source = resolvePodcastSource(metadata, {
    title: "Innovation Without Compromising Data Integrity",
    urls: { watch: "https://www.youtube.com/watch?v=eqWQGLgj5Ts" },
  });
  const options = {
    ingestedAt: "2026-08-19T20:00:00.000Z",
    metadata,
    source,
    transcript: `
YouTube transcript
Video ID: eqWQGLgj5Ts
[0:19] Memory should preserve the exact historical claim.
[0:30] Later evidence can be compared with that claim.
    `,
    chunkCharacters: 500,
    overlapCharacters: 50,
  } as const;

  const first = buildPodcastMemoryDocuments(options);
  const second = buildPodcastMemoryDocuments(options);

  assert.equal(first.length, 1);
  assert.equal(first[0]?.memory_id, second[0]?.memory_id);
  assert.match(
    first[0]?.memory_id ?? "",
    /^podcast:eqWQGLgj5Ts:[a-f0-9]{24}$/,
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
  assert.equal(first[0]?.memory_type, "transcript_chunk");
  assert.equal(first[0]?.source.locator, "Transcript 0:19-0:30 (chunk 1)");
});

test("rejects a transcript whose header contradicts filename provenance", () => {
  const metadata = parseTranscriptFileName(
    "2026-04-25_eqWQGLgj5Ts_aaron-ansari.txt",
  );

  assert.throws(
    () =>
      buildPodcastMemoryDocuments({
        ingestedAt: "2026-08-19T20:00:00.000Z",
        metadata,
        source: resolvePodcastSource(metadata),
        transcript: "Video ID: d5jc2WiWn4M\n[0:00] Wrong source.",
      }),
    /does not match filename/,
  );
});
