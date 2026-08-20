import { verifyElasticsearchConnection } from "../src/lib/elasticsearch.js";

try {
  const result = await verifyElasticsearchConnection();
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
