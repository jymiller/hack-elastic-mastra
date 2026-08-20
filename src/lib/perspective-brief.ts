import { z } from "zod";

const confidenceSchema = z.enum([
  "high",
  "moderate",
  "low",
  "insufficient",
]);

const evidenceIdsSchema = z
  .array(z.string().trim().min(1).max(240))
  .max(10);

export const perspectiveBriefSchema = z.object({
  headline: z.string().trim().min(1).max(500),
  johnPerspective: z.object({
    summary: z.string().trim().min(1).max(2_000),
    confidence: confidenceSchema,
    attributionNote: z.string().trim().min(1).max(700),
    evidenceIds: evidenceIdsSchema,
  }),
  guestPerspectives: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(180),
        summary: z.string().trim().min(1).max(1_500),
        confidence: confidenceSchema,
        evidenceIds: evidenceIdsSchema,
      }),
    )
    .max(8),
  evolution: z.object({
    assessment: z.enum(["changed", "stable", "mixed", "insufficient"]),
    summary: z.string().trim().min(1).max(1_500),
    moments: z
      .array(
        z.object({
          date: z.string().trim().min(1).max(80),
          label: z.string().trim().min(1).max(180),
          summary: z.string().trim().min(1).max(900),
          evidenceIds: evidenceIdsSchema,
        }),
      )
      .max(8),
  }),
  uncertainties: z
    .array(z.string().trim().min(1).max(700))
    .max(8),
  nextQuestion: z.string().trim().min(1).max(800),
});

export type PerspectiveBrief = z.infer<typeof perspectiveBriefSchema>;

function evidenceSuffix(ids: string[]) {
  return ids.length ? ` [${ids.join(", ")}]` : "";
}

export function formatPerspectiveBriefForContext(brief: PerspectiveBrief) {
  const guests = brief.guestPerspectives.length
    ? brief.guestPerspectives
        .map(
          (guest) =>
            `- ${guest.name} (${guest.confidence} confidence): ${guest.summary}${evidenceSuffix(guest.evidenceIds)}`,
        )
        .join("\n")
    : "- No distinct guest perspective could be established.";
  const moments = brief.evolution.moments.length
    ? brief.evolution.moments
        .map(
          (moment) =>
            `- ${moment.date} — ${moment.label}: ${moment.summary}${evidenceSuffix(moment.evidenceIds)}`,
        )
        .join("\n")
    : "- No dated change point could be established.";

  return `${brief.headline}

John's sourced point of view (${brief.johnPerspective.confidence} confidence):
${brief.johnPerspective.summary}${evidenceSuffix(brief.johnPerspective.evidenceIds)}
Attribution note: ${brief.johnPerspective.attributionNote}

Guest perspectives:
${guests}

Evolution over time — ${brief.evolution.assessment}:
${brief.evolution.summary}
${moments}

Uncertainties:
${brief.uncertainties.map((uncertainty) => `- ${uncertainty}`).join("\n") || "- None stated."}

Next question: ${brief.nextQuestion}`;
}
