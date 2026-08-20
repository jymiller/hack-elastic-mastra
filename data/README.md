# Local podcast corpus

Put podcast transcript `.txt` files in `data/dama-la/transcripts/`, or set
`PODCAST_TRANSCRIPT_DIR` to another local directory.

The ingestion script expects filenames shaped like:

```text
YYYY-MM-DD_VIDEO-ID_guest-name.txt
```

Raw transcripts are intentionally ignored by Git. They can be indexed into
your private Elasticsearch project without publishing the source corpus or
including it in the application bundle.
