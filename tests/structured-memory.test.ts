import assert from "node:assert/strict";
import test from "node:test";

import {
  buildStructuredMemoryDocument,
  createStructuredMemoryId,
  normalizeEvidenceQuote,
  structuredMemoryCandidateSchema,
} from "../src/lib/structured-memory.js";

const candidate = {
  type: "claim" as const,
  subject_id: "person:ada",
  subject: "Ada",
  statement: "Ada said evidence must remain auditable.",
  context: "A discussion of durable agent memory.",
  topics: ["memory", "provenance"],
  evidence_quote: "Evidence must remain auditable.",
};

const parent = {
  source_memory_id: "podcast:episode-7:chunk-2",
  parent_chunk:
    "Ada introduced the rule. Evidence must remain auditable. Then the conversation continued.",
  observed_at: "2026-04-25T00:00:00.000Z",
  valid_from: "2026-04-25T00:00:00.000Z",
  ingested_at: "2026-08-19T20:00:00.000Z",
  source: {
    url: "https://example.test/episodes/7",
    title: "Durable Memory",
    published_at: "2026-04-25T00:00:00.000Z",
    episode_id: "episode-7",
    locator: "Transcript 2:10-2:40 (chunk 2)",
  },
} as const;

test("validates the four structured-memory candidate types strictly", () => {
  for (const type of ["claim", "idea", "question", "prediction"] as const) {
    assert.equal(
      structuredMemoryCandidateSchema.parse({ ...candidate, type }).type,
      type,
    );
  }

  assert.throws(
    () =>
      structuredMemoryCandidateSchema.parse({
        ...candidate,
        type: "fact",
      }),
    /Invalid option|Invalid enum value/,
  );
  assert.throws(
    () =>
      structuredMemoryCandidateSchema.parse({
        ...candidate,
        people: ["Ada"],
      }),
    /Unrecognized key|unrecognized_keys/,
  );
});

test("normalizes evidence whitespace but rejects a quote absent from its parent", () => {
  assert.equal(
    normalizeEvidenceQuote("  Evidence\n must   remain auditable. "),
    "Evidence must remain auditable.",
  );

  assert.equal(
    buildStructuredMemoryDocument({
      ...parent,
      parent_chunk: "Evidence\n  must remain auditable.",
      candidate: {
        ...candidate,
        evidence_quote: " Evidence must   remain auditable. ",
      },
    }).source.evidence_quote,
    "Evidence must remain auditable.",
  );

  assert.throws(
    () =>
      buildStructuredMemoryDocument({
        ...parent,
        candidate: {
          ...candidate,
          evidence_quote: "This sentence was never spoken.",
        },
      }),
    /exact substring of its parent chunk/,
  );
});

test("derives stable IDs from source, type, and normalized evidence", () => {
  const first = createStructuredMemoryId(
    parent.source_memory_id,
    "claim",
    " Evidence must\nremain auditable. ",
  );
  const second = createStructuredMemoryId(
    parent.source_memory_id,
    "claim",
    "Evidence   must remain auditable.",
  );

  assert.equal(first, second);
  assert.match(
    first,
    /^podcast:episode-7:chunk-2:claim:[a-f0-9]{24}$/,
  );
  assert.notEqual(
    first,
    createStructuredMemoryId(
      parent.source_memory_id,
      "idea",
      candidate.evidence_quote,
    ),
  );
  assert.notEqual(
    first,
    createStructuredMemoryId(
      "podcast:episode-7:chunk-3",
      "claim",
      candidate.evidence_quote,
    ),
  );
});

test("builds a strict-mapping-compatible UNASSESSED document", () => {
  const document = buildStructuredMemoryDocument({
    ...parent,
    candidate,
    people: [" Ada ", "Ada"],
  });

  assert.deepEqual(Object.keys(document).sort(), [
    "context",
    "ingested_at",
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
  assert.deepEqual(Object.keys(document.source).sort(), [
    "episode_id",
    "evidence_quote",
    "locator",
    "published_at",
    "title",
    "url",
  ]);
  assert.equal(document.status, "UNASSESSED");
  assert.equal("is_current" in document, false);
  assert.deepEqual(document.people, ["Ada"]);
  assert.deepEqual(document.source, {
    ...parent.source,
    evidence_quote: candidate.evidence_quote,
  });

  const withoutPeople = buildStructuredMemoryDocument({
    ...parent,
    candidate,
  });
  assert.deepEqual(withoutPeople.people, []);
});
