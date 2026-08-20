import { optionalEnv } from "./env.js";

const defaultOpenRouterModel = "openrouter/anthropic/claude-haiku-4.5";
const defaultNovitaModel = "zai-org/glm-5.3";
const novitaBaseUrl = "https://api.novita.ai/openai/v1";

export function primaryConversationalModel() {
  return optionalEnv("OPENROUTER_MODEL") ?? defaultOpenRouterModel;
}

export function conversationalModel() {
  const primary = primaryConversationalModel();
  const novitaApiKey = optionalEnv("NOVITA_API_KEY");

  if (!novitaApiKey) return primary;

  return [
    {
      id: "openrouter-primary",
      model: primary,
      maxRetries: 1,
    },
    {
      id: "novita-fallback",
      model: {
        providerId: "novita",
        modelId: optionalEnv("NOVITA_MODEL") ?? defaultNovitaModel,
        url: novitaBaseUrl,
        apiKey: novitaApiKey,
      },
      maxRetries: 1,
    },
  ];
}
