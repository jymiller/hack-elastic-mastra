import { Client } from "@elastic/elasticsearch";

import { requiredEnv } from "./env.js";

let client: Client | undefined;

export function getElasticsearchClient(): Client {
  client ??= new Client({
    node: requiredEnv("ELASTICSEARCH_URL"),
    auth: {
      apiKey: requiredEnv("ELASTIC_API_KEY"),
    },
    serverMode: "serverless",
  });

  return client;
}

export async function verifyElasticsearchConnection() {
  const elasticsearch = getElasticsearchClient();
  const [ping, info] = await Promise.all([
    elasticsearch.ping(),
    elasticsearch.info(),
  ]);

  return {
    ping,
    clusterName: info.cluster_name,
    buildFlavor: info.version.build_flavor,
    version: info.version.number,
  };
}
