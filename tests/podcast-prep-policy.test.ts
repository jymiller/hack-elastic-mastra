import assert from "node:assert/strict";
import test from "node:test";

import {
  ANDREJ_KARPATHY_BENCHMARK_GUIDANCE,
  PODCAST_PREP_AGENT_DESCRIPTION,
  PODCAST_PREP_AGENT_INSTRUCTIONS,
  PODCAST_PREP_DEFAULT_GUEST,
  PODCAST_PREP_OUTPUT_SECTIONS,
  PODCAST_PREP_RUBRIC,
} from "../src/mastra/agents/podcast-prep-policy.js";

test("defines a generic guest-prep supervisor with a useful default use case", () => {
  assert.equal(PODCAST_PREP_DEFAULT_GUEST, "Next Guest");
  assert.match(PODCAST_PREP_AGENT_DESCRIPTION, /Supervisor/i);
  assert.match(PODCAST_PREP_AGENT_DESCRIPTION, /industryResearchAgent/);
  assert.match(PODCAST_PREP_AGENT_DESCRIPTION, /podcastMemorySearchTool/);
  assert.match(PODCAST_PREP_AGENT_INSTRUCTIONS, /NAMED upcoming guest/);
  assert.match(PODCAST_PREP_AGENT_INSTRUCTIONS, /real name only/);
});

test("requires the complete prep brief in a stable order", () => {
  assert.deepEqual(PODCAST_PREP_OUTPUT_SECTIONS, [
    "Identity and disambiguation",
    "Guest experience brief",
    "John's relevant podcast point of view",
    "Overlap, tension, and unknowns",
    "Open-ended questions",
    "Leading or premise questions",
    "Follow-ups",
    "Uncertainties and research gaps",
  ]);

  let previousPosition = -1;
  for (const section of PODCAST_PREP_OUTPUT_SECTIONS) {
    const position = PODCAST_PREP_AGENT_INSTRUCTIONS.indexOf(`## ${section}`);
    assert.ok(position > previousPosition, `${section} must appear in order`);
    previousPosition = position;
  }

  assert.match(PODCAST_PREP_AGENT_INSTRUCTIONS, /Markdown source links/);
  assert.match(PODCAST_PREP_AGENT_INSTRUCTIONS, /timestamp locator/);
  assert.match(PODCAST_PREP_AGENT_INSTRUCTIONS, /memory ID/);
});

test("keeps public research and private podcast retrieval in separate evidence lanes", () => {
  assert.match(
    PODCAST_PREP_AGENT_INSTRUCTIONS,
    /Delegate current PUBLIC research.*industryResearchAgent/s,
  );
  assert.match(
    PODCAST_PREP_AGENT_INSTRUCTIONS,
    /Call podcastMemorySearchTool yourself.*John's historical/s,
  );
  assert.match(
    PODCAST_PREP_AGENT_INSTRUCTIONS,
    /industryResearchAgent cannot access private podcast memory/,
  );
  assert.match(PODCAST_PREP_AGENT_INSTRUCTIONS, /speaker uncertain/);
  assert.match(PODCAST_PREP_AGENT_INSTRUCTIONS, /not permission to guess/);
});

test("evaluates preparation quality without grading subjective viewpoints", () => {
  const rubricIds = PODCAST_PREP_RUBRIC.map(({ id }) => id);
  assert.equal(new Set(rubricIds).size, rubricIds.length);
  assert.deepEqual(rubricIds, [
    "identity-confidence",
    "public-source-quality",
    "podcast-grounding",
    "attribution-discipline",
    "subjective-boundary",
    "question-utility",
  ]);
  assert.match(
    PODCAST_PREP_AGENT_INSTRUCTIONS,
    /evaluates sourcing and interview utility,\s+not whose subjective point of view is right/,
  );
  assert.match(PODCAST_PREP_AGENT_INSTRUCTIONS, /not grades/);
  assert.match(
    PODCAST_PREP_RUBRIC.find(({ id }) => id === "subjective-boundary")?.checks ?? "",
    /rather than correctness judgments/,
  );
  assert.match(PODCAST_PREP_AGENT_INSTRUCTIONS, /premise after each question/);
});

test("supports Andrej Karpathy only as an explicitly chosen comparison lens", () => {
  assert.match(ANDREJ_KARPATHY_BENCHMARK_GUIDANCE, /separate public-research assignment/);
  assert.match(ANDREJ_KARPATHY_BENCHMARK_GUIDANCE, /own talks, writing, repositories/);
  assert.match(ANDREJ_KARPATHY_BENCHMARK_GUIDANCE, /user-selected comparison\s+lens/);
  assert.match(
    ANDREJ_KARPATHY_BENCHMARK_GUIDANCE,
    /never imply that disagreement is\s+an error/i,
  );
  assert.match(PODCAST_PREP_AGENT_INSTRUCTIONS, /SECOND, clearly\s+scoped assignment/);
});
