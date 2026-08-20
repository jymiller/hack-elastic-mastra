# Great Questions AI

Great Questions AI is a living research brain that remembers not just what you
thought, but how your thinking changed—and uses that memory to discover what
you should ask next.

The canonical project concept is preserved verbatim in
[PROJECT-BRIEF.txt](./PROJECT-BRIEF.txt).

## What is in the app

The working prototype now provides:

- a custom research workshop at `/great-questions` with named local notebooks,
  question-specific saved evidence sets, structured perspective briefs, episode
  thumbnails, and timestamped YouTube evidence;
- a podcast-prep workspace at `/podcast-prep` with PDF/text profile upload,
  public/private evidence lanes, precomputed Kevin Lucier demo questions, and
  optional Andrej Karpathy comparison framing;
- a publishable Memory Story at `/demo` that distills the hackathon research
  into six evidence-backed shifts in John's thinking, a John × Andrej Karpathy
  comparison, and the questions that come next;
- a high-level system map at `/architecture`;
- persistent local conversation memory and traces backed by LibSQL;
- OpenRouter as the primary model route with an optional Novita GLM-5.3
  fallback;
- four registered Mastra agents: Great Questions, Podcast Prep, Definitive
  Industry Research, and the approval-gated Agentic Mesh Ingestion Agent;
- an MCP server exposing the agents, Elasticsearch connectivity, podcast search,
  and guarded Agentic Mesh ingestion tools;
- optional MCP client connectivity to Elastic Agent Builder;
- direct, server-side Elasticsearch connectivity;
- hybrid lexical and semantic podcast-memory search with RRF;
- timestamped source citations back to the original episode;
- an idempotent, review-before-running Elasticsearch index setup and ingestion path.

The live corpus contains 25 podcast episodes as 579 searchable transcript
memories: six DAMA LA episodes produce 159 chunks, and 19 Agentic Mesh episodes
produce 420 chunks. The Agentic Mesh write was executed through the guarded
ingestion path after its exact alias, operation shape, and plan hash were
approved. Raw transcripts, generated data, local databases, and credentials are
never committed.

## Memory model

The first proposal is graph-shaped without requiring a separate graph database:

- `<prefix>-memories-v1` stores sourced claims, ideas, questions, and
  predictions as nodes.
- `<prefix>-relations-v1` stores explicit directed edges such as
  `SUPERSEDES`, `CONTRADICTS`, `SUPPORTS`, and `REFINES`.
- `<prefix>-decisions-v1` stores receipts showing which memory IDs governed an
  answer or generated question.

The original memory node remains queryable after a later node supersedes it.
An `is_current` projection makes current-belief retrieval fast, while the edge
record preserves why and when the change occurred.

## Local setup

Requirements: Node.js 22.13 or newer.

```bash
cp .env.example .env
npm install
npm run typecheck
npm run dev
```

Fill `.env` locally. Never commit it. The Mastra development server and Studio
run at `http://localhost:4111`.

Useful local routes:

- `http://localhost:4111/great-questions` — research memory;
- `http://localhost:4111/podcast-prep` — interview preparation;
- `http://localhost:4111/demo` — the publishable, evidence-backed Memory Story;
- `http://localhost:4111/architecture` — solution architecture;
- `http://localhost:4111/agents` — Mastra Studio agents and traces.

The custom routes are an unauthenticated local-demo surface. Add authentication
and deployment-specific access controls before exposing them to the public
internet.

## Connectivity checks

After adding the Elasticsearch endpoint and API key to `.env`:

```bash
npm run check:elastic
npm run inspect:elastic
```

Review [docs/ELASTIC-MEMORY-MODEL.md](./docs/ELASTIC-MEMORY-MODEL.md), then
create the empty indices when ready:

```bash
npm run setup:elastic
```

The setup command creates mappings only. After reviewing the target alias and
bulk operation, ingest the local DAMA LA transcripts with:

```bash
npm run ingest:podcast
```

Ask the agent directly from the terminal with:

```bash
npm run ask -- "What did these guests say about agent memory?"
```

## API and MCP

With `npm run dev` running:

- Mastra REST routes are available under `/api`.
- The agents are registered as `greatQuestionsAgent`, `podcastPrepAgent`,
  `industryResearchAgent`, and `agenticMeshIngestionAgent`.
- The local MCP server is registered as `great-questions`.
- Swagger UI is available at `/swagger-ui` in development.

For Elastic's hosted Agent Builder MCP server, set `ELASTIC_MCP_URL` and a
separate least-privilege `ELASTIC_MCP_API_KEY`. If those variables are absent,
the local Mastra server still starts and uses direct Elasticsearch tools.

## Agentic Mesh write gate

The Agentic Mesh agent validates the ignored local corpus and returns a
transcript-free write plan. It cannot write in that same user turn. Every future
ingestion or transcript change must receive approval for its freshly computed
SHA-256 plan hash. The write tool uses the `great-questions-memories` alias with
`require_alias=true`, `refresh=wait_for`, bounded batches, a five-minute request
timeout, and explicit partial-failure reporting.

## Status

The current app separates the research process from its durable output.
`/great-questions` is the live workshop: Elasticsearch retrieves attributable,
timestamped passages and Mastra agents synthesize them. `/demo` is the
publishable result of that process: a precomputed, source-linked narrative that
can remain online without keeping the AI runtime active. The prototype also
includes persistent Mastra memory and tracing, model fallback, specialist-agent
delegation, interview preparation, and a guarded second-corpus ingestion
workflow. Structured claim/idea/question/prediction document building is
implemented and tested; automated claim extraction and temporal relation
adjudication remain follow-on work.
