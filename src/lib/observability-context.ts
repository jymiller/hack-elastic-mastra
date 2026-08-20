import { RequestContext } from "@mastra/core/request-context";
import { createHash } from "node:crypto";

const localDemoUserId = "john-local-demo";

export function createPodcastPrepSessionId(name: string) {
  const normalized = name.trim().replace(/\s+/g, " ").toLowerCase();
  return `prep-${createHash("sha256")
    .update(normalized)
    .digest("hex")
    .slice(0, 16)}`;
}

export function createUiRequestContext(
  surface: string,
  dimensions: Record<string, string> = {},
) {
  return new RequestContext(
    Object.entries({
      userId: localDemoUserId,
      surface,
      ...dimensions,
    }),
  );
}
