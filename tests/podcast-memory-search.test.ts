import assert from "node:assert/strict";
import test from "node:test";

import {
  timestampedPodcastUrl,
  youtubeThumbnailUrl,
} from "../src/lib/podcast-memory-search.js";

test("adds a YouTube start time from a transcript locator", () => {
  assert.equal(
    timestampedPodcastUrl(
      "https://www.youtube.com/watch?v=episode123",
      "Transcript 30:01-31:40 (chunk 22)",
    ),
    "https://www.youtube.com/watch?v=episode123&t=1801s",
  );

  assert.equal(
    timestampedPodcastUrl(
      "https://youtu.be/episode123?feature=shared",
      "Transcript 1:02:03-1:03:20 (chunk 41)",
    ),
    "https://youtu.be/episode123?feature=shared&t=3723s",
  );
});

test("derives an episode thumbnail without fetching YouTube", () => {
  assert.equal(
    youtubeThumbnailUrl("https://www.youtube.com/watch?v=episode123"),
    "https://i.ytimg.com/vi/episode123/hqdefault.jpg",
  );
  assert.equal(
    youtubeThumbnailUrl("https://example.com/watch?v=episode123"),
    undefined,
  );
});

test("leaves non-YouTube and malformed transcript links unchanged", () => {
  assert.equal(
    timestampedPodcastUrl(
      "https://example.com/episode",
      "Transcript 12:34-13:10 (chunk 8)",
    ),
    "https://example.com/episode",
  );
  assert.equal(
    timestampedPodcastUrl(
      "https://www.youtube.com/watch?v=episode123",
      "Chapter introduction",
    ),
    "https://www.youtube.com/watch?v=episode123",
  );
});
