// Joins population data to the topojson produced by run.sh and cleans up the
// properties: strips the (null) province fields of the Brussels features and
// normalizes typographic apostrophes so the output matches earlier releases.

const fs = require("fs");
const readline = require("readline");

const popFile = process.argv[2];
if (!popFile) {
  console.error("usage: node join_data <TF_SOC_POP_STRUCT_YYYY.txt>");
  process.exit(1);
}

async function aggregatePopulation(file) {
  // pipe-separated file with one row per municipality × sex × nationality ×
  // civil status × age; sum MS_POPULATION per NIS code
  const population = new Map();
  const rl = readline.createInterface({ input: fs.createReadStream(file) });
  let header = null;
  let nisIdx, popIdx;
  for await (const line of rl) {
    if (!header) {
      header = line.replace(/^﻿/, "").split("|");
      nisIdx = header.indexOf("CD_REFNIS");
      popIdx = header.indexOf("MS_POPULATION");
      continue;
    }
    const cols = line.split("|");
    const nis = cols[nisIdx];
    const count = parseInt(cols[popIdx], 10);
    if (!nis || isNaN(count)) continue;
    population.set(nis, (population.get(nis) || 0) + count);
  }
  return population;
}

function cleanProperties(properties) {
  const cleaned = {};
  for (const [key, value] of Object.entries(properties)) {
    if (value === null || value === undefined) continue; // Brussels has no province
    cleaned[key] = typeof value === "string" ? value.replace(/’/g, "'") : value;
  }
  return cleaned;
}

async function main() {
  const population = await aggregatePopulation(popFile);
  const topo = JSON.parse(fs.readFileSync("temp/belgium.unjoined.json"));

  for (const [name, layer] of Object.entries(topo.objects)) {
    for (const geometry of layer.geometries) {
      geometry.properties = cleanProperties(geometry.properties);
      if (name === "municipalities") {
        const count = population.get(geometry.properties.nis);
        if (count === undefined) {
          console.warn(`no population data for ${geometry.properties.nis} (${geometry.properties.name_nl})`);
        } else {
          geometry.properties.population = count;
        }
      }
    }
  }

  fs.writeFileSync("belgium.json", JSON.stringify(topo));

  const munis = topo.objects.municipalities.geometries;
  const total = munis.reduce((sum, g) => sum + (g.properties.population || 0), 0);
  console.log(`wrote belgium.json: ${munis.length} municipalities, ` +
    `${topo.objects.arrondissements.geometries.length} arrondissements, ` +
    `${topo.objects.provinces.geometries.length} provinces, ` +
    `total population ${total}`);
}

main();
