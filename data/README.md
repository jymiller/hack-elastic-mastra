# Local podcast corpus

Put podcast transcript `.txt` files in `data/dama-la/transcripts/`, or set
`PODCAST_TRANSCRIPT_DIR` to another local directory.

The ingestion script expects filenames shaped like:

```text
YYYY-MM-DD_VIDEO-ID_guest-name.txt
```

Agentic Mesh transcripts live in `data/agentic-mesh/transcripts/` with matching
episode metadata under `data/agentic-mesh/episodes/`. Their filenames are shaped
like:

```text
episode-NN-VIDEO-ID-youtube-auto.txt
```

Only the timestamped `.txt` transcripts and episode metadata are required for
ingestion. Local video files are intentionally not used or retained by this
project.

Raw transcripts are intentionally ignored by Git. They can be indexed into
your private Elasticsearch project without publishing the source corpus or
including it in the application bundle.
