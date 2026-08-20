import assert from "node:assert/strict";
import test from "node:test";

import {
  assertStaticOutput,
  renderHowItWorkedPage,
  renderStaticNavigation,
  staticizePage,
} from "../scripts/build-static-site.js";
import { architecturePage } from "../src/mastra/ui/architecture-ui.js";
import { memoryEvolutionDemoPage } from "../src/mastra/ui/memory-evolution-demo.js";

test("static navigation removes Studio and interactive app routes", () => {
  const navigation = renderStaticNavigation("story");

  assert.match(navigation, /Memory story/);
  assert.match(navigation, /How it worked/);
  assert.match(navigation, /Devpost/);
  assert.match(navigation, /Video/);
  assert.doesNotMatch(navigation, /Studio/);
  assert.doesNotMatch(navigation, /href="\/great-questions/);
  assert.doesNotMatch(navigation, /href="\/podcast-prep/);
});

test("published pages contain no runtime API or agent capability", () => {
  const pages = {
    story: staticizePage(memoryEvolutionDemoPage, "story"),
    architecture: staticizePage(architecturePage, "architecture"),
    how: renderHowItWorkedPage(),
  };

  for (const [name, html] of Object.entries(pages)) {
    assert.doesNotThrow(() => assertStaticOutput(name, html));
    assert.doesNotMatch(html, /fetch\s*\(/);
    assert.doesNotMatch(html, /\/api\//);
  }
});

test("static story keeps timestamped evidence links", () => {
  const story = staticizePage(memoryEvolutionDemoPage, "story");

  assert.match(story, /youtube\.com\/watch\?v=[^"&]+&amp;t=\d+s/);
  assert.match(story, /10 timestamped receipts/);
  assert.match(story, /No AI required to view/);
});
