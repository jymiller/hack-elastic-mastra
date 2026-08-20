import { getElasticsearchClient } from "../src/lib/elasticsearch.js";
import { indexDefinitions } from "../src/lib/memory-indices.js";

const client = getElasticsearchClient();
const summary = [];

for (const definition of indexDefinitions) {
  const [exists, aliasExists] = await Promise.all([
    client.indices.exists({ index: definition.index }),
    client.indices.existsAlias({
      index: definition.index,
      name: definition.alias,
    }),
  ]);

  if (!exists) {
    summary.push({
      alias: definition.alias,
      aliasExists,
      index: definition.index,
      exists: false,
      count: 0,
    });
    continue;
  }

  const [{ count }, mapping] = await Promise.all([
    client.count({ index: definition.index }),
    client.indices.getMapping({ index: definition.index }),
  ]);

  summary.push({
    alias: definition.alias,
    aliasExists,
    index: definition.index,
    exists: true,
    count,
    mapping: mapping[definition.index]?.mappings,
  });
}

console.log(JSON.stringify(summary, null, 2));
