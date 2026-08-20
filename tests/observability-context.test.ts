import assert from "node:assert/strict";
import test from "node:test";

import {
  createPodcastPrepSessionId,
  createUiRequestContext,
} from "../src/lib/observability-context.js";

test("creates a stable cost-center ID from a prep workspace name", () => {
  const expected = createPodcastPrepSessionId("Next Guest interview");

  assert.match(expected, /^prep-[a-f0-9]{16}$/);
  assert.equal(
    createPodcastPrepSessionId("  NEXT   GUEST interview  "),
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
    podcastPrepName: "Next Guest interview",
  });

  assert.equal(requestContext.get("userId"), "john-local-demo");
  assert.equal(requestContext.get("surface"), "podcast-prep-ui");
  assert.equal(requestContext.get("sessionId"), "prep-example");
  assert.equal(
    requestContext.get("podcastPrepName"),
    "Next Guest interview",
  );
});
