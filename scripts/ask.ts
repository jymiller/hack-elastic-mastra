const invocation =
  'node --env-file-if-exists=.env --import tsx scripts/ask.ts "Your question"';

function envValue(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function main(): Promise<void> {
  const question = process.argv.slice(2).join(" ").trim();

  if (!question) {
    throw new Error(`A question is required.\nUsage: ${invocation}`);
  }

  const model =
    envValue("OPENROUTER_MODEL") ??
    "openrouter/anthropic/claude-haiku-4.5";

  if (model.startsWith("openrouter/") && !envValue("OPENROUTER_API_KEY")) {
    throw new Error(
      "Missing OPENROUTER_API_KEY. Add it to your local .env file and run the command again.",
    );
  }

  // Load the existing agent only after validating credentials. Importing it may
  // connect optional MCP servers configured for that agent.
  const { greatQuestionsAgent } = await import(
    "../src/mastra/agents/great-questions-agent.js"
  );
  const response = await greatQuestionsAgent.generate(question);
  const answer = response.text.trim();

  if (!answer) {
    throw new Error("The Great Questions agent returned an empty answer.");
  }

  process.stdout.write(`${answer}\n`);
}

try {
  await main();
} catch (error) {
  const message = errorMessage(error);
  console.error(`Great Questions request failed: ${message}`);

  if (/\b(401|unauthorized|invalid api key|authentication)\b/i.test(message)) {
    console.error(
      "Check that OPENROUTER_API_KEY in .env is current and has available credits.",
    );
  }

  process.exitCode = 1;
}
