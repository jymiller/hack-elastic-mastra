import assert from "node:assert/strict";
import test from "node:test";

import {
  createPodcastPrepSessionId,
  createUiRequestContext,
} from "../src/lib/observability-context.js";

test("creates a stable cost-center ID from a prep workspace name", () => {
  const expected = createPodcastPrepSessionId("Kevin Lucier interview");

  assert.match(expected, /^prep-[a-f0-9]{16}$/);
  assert.equal(
    createPodcastPrepSessionId("  KEVIN   LUCIER interview  "),
    expected,
  );
  assert.notEqual(
    createPodcastPrepSessionId("Agentic Mesh episode 20"),
    expected,
  );
});

test("attaches user, surface, and prep cost dimensions to a request", () => {
  const requestContext = createUiRequestContext("podcast-prep-ui", {
    sessionId: "prep-example",
    podcastPrepName: "Kevin Lucier interview",
  });

  assert.equal(requestContext.get("userId"), "john-local-demo");
  assert.equal(requestContext.get("surface"), "podcast-prep-ui");
  assert.equal(requestContext.get("sessionId"), "prep-example");
  assert.equal(
    requestContext.get("podcastPrepName"),
    "Kevin Lucier interview",
  );
});
