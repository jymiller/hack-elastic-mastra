# DevPost submission — Great Questions AI

## Project name

Great Questions AI

## Elevator pitch

A living research brain that remembers what you thought, tracks how your ideas change, and uses that history to discover the questions worth asking next.

## About the project

## Inspiration

Most AI research tools retrieve documents. They can find what someone said, but
they do not preserve the evolution of thought: what you believed at a point in
time, what evidence changed it, and which assumptions remain unresolved.

Great Questions AI starts from a different premise: memory is not about the
past. It is an engine for better future thinking.

## What it does

Great Questions AI turns podcast conversations into a sourced, searchable
research memory. In the current demo, a Mastra agent answers natural-language
questions over a live Elasticsearch corpus and returns the episode title, date,
timestamp range, and source URL for the evidence it used.

The product is organized around three questions:

1. **What did I think?** Recover earlier ideas in their original context.
2. **What changed my mind?** Compare evidence and positions across time.
3. **What's next?** Use unresolved assumptions to generate better research and
   podcast questions.

## How we built it

- **Mastra** provides the interactive research agent, local Studio experience,
  REST API, and MCP server.
- **Elasticsearch Serverless** is the long-term source of truth. Versioned
  indices and aliases hold memories, relations, and answer receipts.
- Podcast transcripts are parsed into deterministic, overlapping timestamped
  chunks and bulk-indexed through an alias.
- Each chunk is indexed into a `semantic_text` field. Search combines lexical
  relevance and semantic retrieval with reciprocal rank fusion.
- The agent is required to search before answering corpus questions and to cite
  title, date, timestamp, and URL.
- **OpenRouter** supplies the language model used by the Mastra agent.

The working demo contains six DAMA LA podcast episodes represented by 159
Elasticsearch transcript memories. We also recovered all 19 Agentic Mesh
Podcast transcripts locally as the next, more chronological corpus; they are
kept out of Git and are being prepared for the same deterministic ingestion
pipeline.

## Challenges we ran into

The hardest part was making memory auditable rather than decorative. Transcript
captions are not perfectly diarized, so the agent must not invent speaker
attribution. Semantic indexing also has a model warm-up cost, and a safe public
release has to exclude raw transcripts and credentials while keeping the full
pipeline reproducible.

We addressed those constraints with deterministic document IDs, strict
mappings, explicit aliases, long first-write timeouts, exact source locators,
and grounding instructions that state uncertainty when a speaker is unclear.

## Accomplishments that we're proud of

- Live hybrid search over 159 timestamped podcast memories.
- Grounded answers with click-through episode citations.
- One search capability exposed consistently as a Mastra tool and through MCP.
- A graph-ready memory model that preserves historical nodes instead of
  overwriting them.
- A privacy-safe repository that excludes credentials and raw podcast data.

## What we learned

Retrieval becomes memory when provenance and time are first-class. A strong
embedding model is not enough: the system must preserve the original evidence,
distinguish episode participants from verified speakers, and make every claimed
change traceable to governing memory IDs.

## What's next for Great Questions AI

Next we will ingest the 19 Agentic Mesh episodes, extract validated claims,
ideas, questions, and predictions beside the raw transcript memories, and add
explicit `SUPPORTS`, `CONTRADICTS`, `REFINES`, and `SUPERSEDES` relations. An
answer-receipt index will record which memories governed each conclusion. That
closes the loop: capture, extract, reflect, generate better questions, capture
again.

## Built with

Elasticsearch, Elasticsearch Serverless, semantic_text, reciprocal-rank-fusion,
Mastra, TypeScript, Node.js, OpenRouter, MCP, Zod

## Try it out

https://github.com/jymiller/hack-elastic-mastra

## Public repo

https://github.com/jymiller/hack-elastic-mastra

## Demo talk track (about 90 seconds)

**0:00–0:12 — Problem**

"Most AI research tools can find what I said. Great Questions AI is built to
remember how my thinking evolves—what I thought, what changed my mind, and what
I should ask next."

**0:12–0:28 — Architecture**

"Mastra is the agent experience. Elasticsearch Serverless is the long-term
memory. Right now six podcast episodes are live as 159 timestamped memories.
Every transcript chunk is searchable lexically and semantically, and the two
rankings are fused before the agent sees the evidence."

**0:28–0:58 — Live demo**

In Mastra Studio, ask:

> Across the podcast episodes, what are the most important ideas about agent
> memory? Cite the episodes and timestamps, and say when speaker attribution is
> uncertain.

While it runs, say:

"The agent is calling the podcast-memory-search tool, not answering from model
memory. The result comes back with the original episode, date, timestamp range,
and URL, so every claim is inspectable."

If time allows, follow with:

> What unresolved assumptions in these conversations would make the best next
> podcast questions? Separate sourced observations from your suggestions.

**0:58–1:18 — Memory model**

"Behind this are three Elasticsearch aliases: memories for sourced nodes,
relations for how ideas support, refine, contradict, or supersede one another,
and decisions for receipts showing which memories governed an answer. We never
overwrite history just because a newer idea appears."

**1:18–1:30 — Close**

"All 19 Agentic Mesh transcripts are now recovered locally for the next ingest.
The goal is a living research brain that turns historical conversations into
the next great question."

## Emergency demo fallback

If the model call is slow, open the `podcast-memory-search` tool directly in
Mastra Studio and run:

```json
{
  "query": "agent memory and persistent context",
  "limit": 5
}
```

This demonstrates the live Elasticsearch hybrid retrieval and citations without
waiting for the language model to synthesize an answer.
