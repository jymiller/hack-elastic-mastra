import {
  registerApiRoute,
  type ContextWithMastra,
} from "@mastra/core/server";

import { memoryEvolutionDemoPage } from "./memory-evolution-demo.js";

export const demoUiRoutes = [
  registerApiRoute("/demo", {
    method: "GET",
    requiresAuth: false,
    handler: (context: ContextWithMastra) =>
      context.html(memoryEvolutionDemoPage),
  }),
];
