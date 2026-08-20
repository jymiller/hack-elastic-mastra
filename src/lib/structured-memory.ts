import { createHash } from "node:crypto";

import { z } from "zod";

export const structuredMemoryTypeSchema = z.enum([
  "claim",
  "idea",
  "question",
  "prediction",
]);

export type StructuredMemoryType = z.infer<
  typeof structuredMemoryTypeSchema
>;

function normalizeWhitespace(value: string): string {
  return value.normalize("NFC").replace(/\s+/gu, " ").trim();
}

const normalizedNonEmptyString = z
  .string()
  .transform(normalizeWhitespace)
  .pipe(z.string().min(1));

const normalizedString = z.string().transform(normalizeWhitespace);
const isoTimestampSchema = z.string().datetime({ offset: true });

/**
 * The extraction candidate intentionally has no `people` field. People are
 * provenance supplied by the caller, never names inferred from free text.
 */
export const structuredMemoryCandidateSchema = z
  .object({
    type: structuredMemoryTypeSchema,
    subject_id: normalizedNonEmptyString,
    subject: normalizedNonEmptyString,
    statement: normalizedNonEmptyString,
    context: normalizedString.default(""),
    topics: z.array(normalizedNonEmptyString).default([]),
    evidence_quote: normalizedNonEmptyString,
  })
  .strict();

export const structuredMemoryCandidatesSchema = z.array(
  structuredMemoryCandidateSchema,
);

export type StructuredMemoryCandidate = z.infer<
  typeof structuredMemoryCandidateSchema
>;

export const structuredMemorySourceSchema = z
  .object({
    url: normalizedNonEmptyString,
    title: normalizedNonEmptyString,
    published_at: isoTimestampSchema,
    episode_id: normalizedNonEmptyString,
    locator: normalizedNonEmptyString,
  })
  .strict();

export type StructuredMemorySource = z.infer<
  typeof structuredMemorySourceSchema
>;

const structuredMemoryDocumentSourceSchema = structuredMemorySourceSchema
  .extend({ evidence_quote: normalizedNonEmptyString })
  .strict();

export const structuredMemoryDocumentSchema = z
  .object({
    memory_id: normalizedNonEmptyString,
    memory_type: structuredMemoryTypeSchema,
    subject_id: normalizedNonEmptyString,
    subject: normalizedNonEmptyString,
    statement: normalizedNonEmptyString,
    context: normalizedString,
    people: z.array(normalizedNonEmptyString),
    topics: z.array(normalizedNonEmptyString),
    status: z.literal("UNASSESSED"),
    observed_at: isoTimestampSchema,
    valid_from: isoTimestampSchema,
    valid_to: isoTimestampSchema.optional(),
    ingested_at: isoTimestampSchema,
    source: structuredMemoryDocumentSourceSchema,
  })
  .strict();

export type StructuredMemoryDocument = z.infer<
  typeof structuredMemoryDocumentSchema
>;

export interface StructuredMemoryParent {
  source_memory_id: string;
  parent_chunk: string;
  observed_at: string;
  valid_from: string;
  valid_to?: string;
  ingested_at: string;
  source: StructuredMemorySource;
  people?: readonly string[];
}

export interface BuildStructuredMemoryDocumentOptions
  extends StructuredMemoryParent {
  candidate: StructuredMemoryCandidate;
}

export interface BuildStructuredMemoryDocumentsOptions
  extends StructuredMemoryParent {
  candidates: readonly StructuredMemoryCandidate[];
}

/**
 * Normalize only representation details. Case and punctuation remain unchanged
 * so the result is still an exact, auditable quotation.
 */
export function normalizeEvidenceQuote(value: string): string {
  const normalized = normalizeWhitespace(value);

  if (!normalized) {
    throw new Error("Evidence quote must not be empty.");
  }

  return normalized;
}

/**
 * Return the normalized quote only when it occurs verbatim in the normalized
 * parent chunk. Matching is deliberately case-sensitive.
 */
export function assertEvidenceQuoteInParentChunk(
  evidenceQuote: string,
  parentChunk: string,
): string {
  const normalizedQuote = normalizeEvidenceQuote(evidenceQuote);
  const normalizedParent = normalizeWhitespace(parentChunk);

  if (!normalizedParent.includes(normalizedQuote)) {
    throw new Error(
      "Evidence quote must be an exact substring of its parent chunk.",
    );
  }

  return normalizedQuote;
}

/**
 * Keep lineage readable while hashing quote content to a compact stable suffix.
 */
export function createStructuredMemoryId(
  sourceMemoryId: string,
  type: StructuredMemoryType,
  evidenceQuote: string,
): string {
  const normalizedSourceMemoryId = normalizeWhitespace(sourceMemoryId);

  if (!normalizedSourceMemoryId) {
    throw new Error("source_memory_id must not be empty.");
  }

  const parsedType = structuredMemoryTypeSchema.parse(type);
  const quoteHash = createHash("sha256")
    .update(normalizeEvidenceQuote(evidenceQuote), "utf8")
    .digest("hex")
    .slice(0, 24);

  return `${normalizedSourceMemoryId}:${parsedType}:${quoteHash}`;
}

function normalizeKeywordList(values: readonly string[]): string[] {
  return [...new Set(values.map(normalizeWhitespace).filter(Boolean))];
}

export function buildStructuredMemoryDocument(
  options: BuildStructuredMemoryDocumentOptions,
): StructuredMemoryDocument {
  const candidate = structuredMemoryCandidateSchema.parse(options.candidate);
  const source = structuredMemorySourceSchema.parse(options.source);
  const evidenceQuote = assertEvidenceQuoteInParentChunk(
    candidate.evidence_quote,
    options.parent_chunk,
  );

  return structuredMemoryDocumentSchema.parse({
    memory_id: createStructuredMemoryId(
      options.source_memory_id,
      candidate.type,
      evidenceQuote,
    ),
    memory_type: candidate.type,
    subject_id: candidate.subject_id,
    subject: candidate.subject,
    statement: candidate.statement,
    context: candidate.context,
    people: normalizeKeywordList(options.people ?? []),
    topics: normalizeKeywordList(candidate.topics),
    status: "UNASSESSED",
    observed_at: options.observed_at,
    valid_from: options.valid_from,
    ...(options.valid_to === undefined
      ? {}
      : { valid_to: options.valid_to }),
    ingested_at: options.ingested_at,
    source: {
      ...source,
      evidence_quote: evidenceQuote,
    },
  });
}

export function buildStructuredMemoryDocuments(
  options: BuildStructuredMemoryDocumentsOptions,
): StructuredMemoryDocument[] {
  const candidates = structuredMemoryCandidatesSchema.parse(
    options.candidates,
  );

  return candidates.map((candidate) =>
    buildStructuredMemoryDocument({
      ...options,
      candidate,
    }),
  );
}
