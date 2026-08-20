# Elasticsearch memory model proposal

This is a reviewable first model, not a permanent ontology.

## Recommendation

Use property-graph semantics without introducing a separate property-graph
database for the first demo.

Elasticsearch remains the source of truth for three kinds of records:

1. Memory nodes: sourced claims, ideas, questions, and predictions.
2. Relation edges: explicit, directed changes such as `SUPERSEDES`,
   `CONTRADICTS`, `SUPPORTS`, and `REFINES`.
3. Decision receipts: the exact memory IDs retrieved and selected for an answer
   or next question.

Elastic's Graph Explore API discovers statistically significant associations
between indexed terms. That is useful later, but it is not a substitute for
explicit, source-backed supersession edges.

## What a memory node looks like

```json
{
  "memory_id": "mem_agent_memory_2026_08_19_b",
  "memory_type": "claim",
  "subject_id": "agent-memory",
  "subject": "Agent memory",
  "statement": "A later, source-backed position goes here.",
  "context": "Why this statement mattered in the conversation.",
  "people": ["speaker-id"],
  "topics": ["memory", "agents"],
  "status": "ACTIVE",
  "is_current": true,
  "observed_at": "2026-08-19T20:00:00Z",
  "valid_from": "2026-08-19T20:00:00Z",
  "valid_to": null,
  "ingested_at": "2026-08-19T20:05:00Z",
  "source": {
    "url": "https://example.com/source",
    "title": "Attributable source title",
    "published_at": "2026-08-19",
    "episode_id": "episode-id",
    "locator": "00:12:30-00:12:45",
    "evidence_quote": "A short, attributable excerpt goes here."
  }
}
```

`semantic_content` is populated by Elasticsearch through `copy_to` from the
statement, context, and evidence quote. The generated embedding is stored
internally by the `semantic_text` field and is not normally shown in `_source`.

## What the supersession edge looks like

```json
{
  "relation_id": "rel_b_supersedes_a",
  "relation_type": "SUPERSEDES",
  "from_memory_id": "mem_agent_memory_2026_08_19_b",
  "to_memory_id": "mem_agent_memory_2026_02_19_a",
  "observed_at": "2026-08-19T20:00:00Z",
  "rationale": "The later source explicitly changes the governing belief.",
  "evidence_memory_ids": ["mem_agent_memory_2026_08_19_b"],
  "source_url": "https://example.com/source",
  "ingested_at": "2026-08-19T20:05:00Z"
}
```

The old memory document is retained. Its `is_current` projection becomes
`false`, its `status` becomes `SUPERSEDED`, and `valid_to` records when it
stopped governing current answers. Historical queries use the time fields;
current queries filter `is_current: true`.

## What it looks like in Elastic

In Kibana Discover, each record is a row. Filter the data view by index and add
columns such as:

- memories: `observed_at`, `subject`, `statement`, `status`, `source.title`
- relations: `observed_at`, `relation_type`, `from_memory_id`, `to_memory_id`
- decisions: `timestamp`, `request`, `governing_memory_ids`,
  `changed_because`

Expand a row to see its complete JSON. Use Developer Tools for exact queries
and Index Management to inspect mappings.

## Why not a graph database yet?

The first proof needs temporal filtering, hybrid text/semantic retrieval,
one-hop explicit relations, and auditable IDs. Elasticsearch handles those
directly. A dedicated property-graph database becomes useful if the product
depends on deep, arbitrary multi-hop traversal, graph algorithms, or a graph
query language as a primary interaction—not merely because the data contains
relationships.
