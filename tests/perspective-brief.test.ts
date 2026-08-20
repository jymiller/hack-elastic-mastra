import assert from "node:assert/strict";
import test from "node:test";

import {
  formatPerspectiveBriefForContext,
  perspectiveBriefSchema,
} from "../src/lib/perspective-brief.js";

const example = {
  headline: "The evidence suggests continuity with a sharper implementation focus.",
  johnPerspective: {
    summary: "John repeatedly frames memory as infrastructure for continuity.",
    confidence: "moderate" as const,
    attributionNote: "One excerpt identifies John; another speaker is uncertain.",
    evidenceIds: ["memory-1"],
  },
  guestPerspectives: [
    {
      name: "Guest A",
      summary: "The guest emphasizes retrieval quality.",
      confidence: "high" as const,
      evidenceIds: ["memory-2"],
    },
  ],
  evolution: {
    assessment: "mixed" as const,
    summary: "The core view is stable while the mechanism becomes more specific.",
    moments: [
      {
        date: "2025-01-01",
        label: "Continuity",
        summary: "Memory is framed as context retention.",
        evidenceIds: ["memory-1"],
      },
    ],
  },
  uncertainties: ["The corpus does not prove John's current view."],
  nextQuestion: "Which memory failures matter most in practice?",
};

test("validates a sourced perspective brief with an explicit evolution assessment", () => {
  const parsed = perspectiveBriefSchema.parse(example);

  assert.equal(parsed.evolution.assessment, "mixed");
  assert.equal(parsed.johnPerspective.confidence, "moderate");
});

test("formats the structured brief into durable conversation context", () => {
  const context = formatPerspectiveBriefForContext(example);

  assert.match(context, /John's sourced point of view/);
  assert.match(context, /Guest A/);
  assert.match(context, /Other participant perspectives/);
  assert.match(context, /Evolution over time — mixed/);
  assert.match(context, /memory-2/);
});
