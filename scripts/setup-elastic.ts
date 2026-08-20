import { getElasticsearchClient } from "../src/lib/elasticsearch.js";
import { indexDefinitions } from "../src/lib/memory-indices.js";

const client = getElasticsearchClient();

for (const definition of indexDefinitions) {
  const exists = await client.indices.exists({ index: definition.index });

  if (!exists) {
    await client.indices.create({
      index: definition.index,
      aliases: {
        [definition.alias]: { is_write_index: true },
      },
      mappings: definition.mappings,
    });
    console.log(`created ${definition.index} -> ${definition.alias}`);
    continue;
  }

  const aliasExists = await client.indices.existsAlias({
    index: definition.index,
    name: definition.alias,
  });

  if (!aliasExists) {
    await client.indices.putAlias({
      index: definition.index,
      is_write_index: true,
      name: definition.alias,
    });
    console.log(`aliased ${definition.index} -> ${definition.alias}`);
    continue;
  }

  console.log(`exists  ${definition.index} -> ${definition.alias}`);
}
