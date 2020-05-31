const fs = require("fs/promises");

// original topojson file
const topoFile = 'source_data/fusies.json';

// NIS codes
const nisFile = "source_data/REFNIS_2019.csv";

// population data
const populationFile = "source_data/bevolking_per_gemeente.csv"

// output file
const outputFile = "belgium.json";

(async function () {
  // read files
  const topojson = JSON.parse(await fs.readFile(topoFile));
  const nisData = (await fs.readFile(nisFile, "utf8")).split("\n").map(line => line.split(";"));
  const populationData = (await fs.readFile(populationFile, "utf8")).split("\n").map(line => line.trim().split(","));

  // rename gemeentes to municipalities
  topojson.objects.municipalities = topojson.objects.Gemeenten;
  delete topojson.objects.Gemeenten;

  // iterate over all munis
  topojson.objects.municipalities.geometries.map(muni => {
    // manually fix the spelling in the original topojson file
    if (muni.properties?.NAME_4 === "Sint-Joost-ten-Noode") muni.properties.NAME_4 = "Sint-Joost-ten-Node";
    if (muni.properties?.NAME_4 === "MOERBEKE-WAAS") muni.properties.NAME_4 = "Moerbeke";
    if (muni.properties?.NAME_4 === "Écaussinnes") muni.properties.NAME_4 = "Ecaussinnes";
    if (muni.properties?.NAME_4 === "Celles-lez-Tournai") muni.properties.NAME_4 = "Celles";
    if (muni.properties?.NAME_4 === "Blegny") muni.properties.NAME_4 = "Blégny";
    if (muni.properties?.NAME_4 === "Fernlemont") muni.properties.NAME_4 = "Fernelmont";

    // merge the official names and nis code
    const name = muni.properties?.NAME_4?.toLowerCase();
    let row = nisData.find(row => [row[1], row[4]].map(n => n.toLowerCase()).includes(name));
    if (row) {
      muni.properties.nis = row[0];
      muni.properties.name_fr = row[1];
      muni.properties.name_nl = row[4];
    }

    // merge population data
    row = populationData.find(row => row[0] === muni.properties.nis);
    if (row) {
      muni.properties.population = +row[4];
    }

    // remove unused properties
    delete muni.properties.ISO;
    delete muni.properties.ID_0;
    delete muni.properties.ID_1;
    delete muni.properties.ID_2;
    delete muni.properties.ID_3;
    delete muni.properties.ID_4;
    delete muni.properties.NAME_0;
    delete muni.properties.NAME_1;
    delete muni.properties.NAME_2;
    delete muni.properties.NAME_3;
    delete muni.properties.NAME_4;
    delete muni.properties.VARNAME_4;
    delete muni.properties.TYPE_4;
    delete muni.properties.ENGTYPE_4;
    delete muni.properties.NAME_4_NEW;
    delete muni.properties["NAME_3 - NEW"];
    delete muni.properties["NAME_2 - New"];
  });

  await fs.writeFile(outputFile, JSON.stringify(topojson));
}());