# Great Questions AI

Great Questions AI is a living research brain that remembers not just what you
thought, but how your thinking changed—and uses that memory to discover what
you should ask next.

The canonical project concept is preserved verbatim in
[PROJECT-BRIEF.txt](./PROJECT-BRIEF.txt).

## Current foundation

The working hack-night prototype provides:

- a Mastra agent served through Mastra's REST API;
- an MCP server that exposes the same agent and connectivity tool;
- optional MCP client connectivity to Elastic Agent Builder;
- OpenRouter model routing through `OPENROUTER_API_KEY`;
- direct, server-side Elasticsearch connectivity;
- hybrid lexical and semantic podcast-memory search with RRF;
- timestamped source citations back to the original episode;
- an idempotent, review-before-running Elasticsearch index setup and ingestion path.

The local demo has six DAMA LA episodes loaded as 159 searchable transcript
memories. Raw transcripts, generated data, and credentials are never committed.

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
- The agent is registered as `greatQuestionsAgent`.
- The local MCP server is registered as `great-questions`.
- Swagger UI is available at `/swagger-ui` in development.

For Elastic's hosted Agent Builder MCP server, set `ELASTIC_MCP_URL` and a
separate least-privilege `ELASTIC_MCP_API_KEY`. If those variables are absent,
the local Mastra server still starts and uses direct Elasticsearch tools.

## Status

The current demo proves the first layer of the memory loop: attributable,
timestamped retrieval over a live Elasticsearch corpus through a Mastra agent.
The next layer is to extract structured claims, ideas, questions, and predictions
from the recovered 19-episode Agentic Mesh corpus, then connect them with
auditable temporal relations and decision receipts.
