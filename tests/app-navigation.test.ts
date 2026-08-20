import assert from "node:assert/strict";
import test from "node:test";

import {
  renderAppHeader,
  renderAppNavigation,
  type GreatQuestionsPage,
} from "../src/mastra/ui/app-navigation.js";

const pages: GreatQuestionsPage[] = [
  "research",
  "podcast-prep",
  "demo",
  "architecture",
];

test("primary navigation exposes every custom experience and Studio", () => {
  const navigation = renderAppNavigation("research");

  for (const href of [
    "/great-questions",
    "/podcast-prep",
    "/demo",
    "/architecture",
    "/agents",
  ]) {
    assert.match(navigation, new RegExp(`href="${href}"`));
  }
});

test("primary navigation marks exactly one active custom page", () => {
  for (const page of pages) {
    const navigation = renderAppNavigation(page);
    assert.equal(navigation.match(/aria-current="page"/g)?.length, 1);
  }
});

test("every page gets the same application identity around its navigation", () => {
  for (const page of pages) {
    const header = renderAppHeader(page);
    assert.match(header, /Great Questions AI/);
    assert.match(header, /Evidence memory for better questions/);
    assert.match(header, /class="gq-app-header"/);
    assert.match(header, /aria-label="Primary"/);
  }
});
