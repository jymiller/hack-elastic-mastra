import { optionalEnv } from "./env.js";

function indexPrefix(): string {
  const prefix = optionalEnv("ELASTICSEARCH_INDEX_PREFIX") ?? "great-questions";

  if (!/^[a-z0-9][a-z0-9-]*$/.test(prefix)) {
    throw new Error(
      "ELASTICSEARCH_INDEX_PREFIX must contain only lowercase letters, numbers, and hyphens.",
    );
  }

  return prefix;
}

const prefix = indexPrefix();

export const memoryAlias = `${prefix}-memories`;
export const relationAlias = `${prefix}-relations`;
export const decisionAlias = `${prefix}-decisions`;

export const memoryIndex = `${memoryAlias}-v1`;
export const relationIndex = `${relationAlias}-v1`;
export const decisionIndex = `${decisionAlias}-v1`;

export const memoryMappings = {
  dynamic: "strict",
  properties: {
    memory_id: { type: "keyword" },
    memory_type: { type: "keyword" },
    subject_id: { type: "keyword" },
    subject: {
      type: "text",
      fields: { keyword: { type: "keyword", ignore_above: 256 } },
    },
    statement: { type: "text", copy_to: "semantic_content" },
    context: { type: "text", copy_to: "semantic_content" },
    semantic_content: { type: "semantic_text" },
    people: { type: "keyword" },
    topics: { type: "keyword" },
    status: { type: "keyword" },
    is_current: { type: "boolean" },
    observed_at: { type: "date" },
    valid_from: { type: "date" },
    valid_to: { type: "date" },
    ingested_at: { type: "date" },
    source: {
      properties: {
        url: { type: "keyword", ignore_above: 2048 },
        title: {
          type: "text",
          fields: { keyword: { type: "keyword", ignore_above: 512 } },
        },
        published_at: { type: "date" },
        episode_id: { type: "keyword" },
        locator: { type: "keyword", ignore_above: 512 },
        evidence_quote: { type: "text", copy_to: "semantic_content" },
      },
    },
  },
} as const;

export const relationMappings = {
  dynamic: "strict",
  properties: {
    relation_id: { type: "keyword" },
    relation_type: { type: "keyword" },
    from_memory_id: { type: "keyword" },
    to_memory_id: { type: "keyword" },
    observed_at: { type: "date" },
    rationale: { type: "text" },
    evidence_memory_ids: { type: "keyword" },
    source_url: { type: "keyword", ignore_above: 2048 },
    ingested_at: { type: "date" },
  },
} as const;

export const decisionMappings = {
  dynamic: "strict",
  properties: {
    receipt_id: { type: "keyword" },
    request: { type: "text" },
    answer_before: { type: "text" },
    answer_after: { type: "text" },
    generated_question: { type: "text" },
    retrieved_memory_ids: { type: "keyword" },
    governing_memory_ids: { type: "keyword" },
    superseded_memory_ids: { type: "keyword" },
    changed_because: { type: "text" },
    timestamp: { type: "date" },
  },
} as const;

export const indexDefinitions = [
  { alias: memoryAlias, index: memoryIndex, mappings: memoryMappings },
  { alias: relationAlias, index: relationIndex, mappings: relationMappings },
  { alias: decisionAlias, index: decisionIndex, mappings: decisionMappings },
] as const;
