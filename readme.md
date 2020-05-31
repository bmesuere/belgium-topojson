# Topojson file of Belgian municipalities
The repository contains a topojson file (`belgium.json`) of the Belgian municipalities. For each city, these properties are set:

- `nis`
- `name_nl`
- `name_fr`

## Data sources
The base map is taken from [arneh61](https://github.com/arneh61/Belgium-Map). While the geo-part of this map is great, the properties aren't that useful. Naming of the properties is all over the place and the nis code (needed to join with other data sources) isn't present.

If you wish to modifiy the properties, you can modify the `join_data.js` script to create a new topojson file.

- fusies.json: https://github.com/arneh61/Belgium-Map
- REFNIS_2019.csv (converted to urf8): https://statbel.fgov.be/nl/over-statbel/methodologie/classificaties/geografie