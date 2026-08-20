import assert from "node:assert/strict";
import test from "node:test";

import {
  guestMemoryPrompts,
  industryComparisons,
  memoryStoryChapters,
  nextMemoryQuestions,
  timestampedMemoryStoryUrl,
} from "../src/lib/memory-story.js";

test("memory story forms a six-stage chronological evidence arc", () => {
  assert.equal(memoryStoryChapters.length, 6);
  assert.deepEqual(
    memoryStoryChapters.map((chapter) => chapter.index),
    ["01", "02", "03", "04", "05", "06"],
  );

  for (const chapter of memoryStoryChapters) {
    assert.ok(chapter.summary.length > 40);
    assert.ok(chapter.changed.length > 30);
    assert.ok(chapter.question.endsWith("?"));
    assert.ok(chapter.receipts.length > 0);
  }
});

test("every podcast claim carries a unique indexed receipt and timestamped source", () => {
  const receipts = memoryStoryChapters.flatMap((chapter) => chapter.receipts);

  assert.equal(receipts.length, 10);
  assert.equal(new Set(receipts.map((receipt) => receipt.id)).size, 10);

  for (const receipt of receipts) {
    assert.match(receipt.id, /^agentic-mesh:[A-Za-z0-9_-]{11}:[a-f0-9]{24}$/);
    assert.equal(new URL(receipt.url).hostname, "www.youtube.com");
    assert.equal(
      new URL(timestampedMemoryStoryUrl(receipt)).searchParams.get("t"),
      `${receipt.seconds}s`,
    );
  }
});

test("industry comparison separates convergence, extension, and unresolved gap", () => {
  assert.deepEqual(
    industryComparisons.map((comparison) => comparison.id),
    ["convergence", "extension", "gap"],
  );

  for (const comparison of industryComparisons) {
    assert.equal(new URL(comparison.sourceUrl).protocol, "https:");
  }
});

test("story ends in research questions and interview prompts", () => {
  assert.equal(nextMemoryQuestions.length, 5);
  assert.deepEqual(
    guestMemoryPrompts.map((prompt) => prompt.label),
    ["Open", "Leading", "Compare", "Evolve"],
  );
});
