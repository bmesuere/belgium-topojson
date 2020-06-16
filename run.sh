# setup
yarn install
mkdir temp

# convert to geojson and merge into single topojson
yarn run topo2geo Prov=temp/Prov.geo.json < source_data/Prov.json
yarn run topo2geo ARR=temp/ARR.geo.json < source_data/ARR.json
yarn run topo2geo Gemeenten=temp/Gemeenten.geo.json < source_data/Gemeenten.json
yarn run geo2topo Prov=temp/Prov.geo.json ARR=temp/ARR.geo.json Gemeenten=temp/Gemeenten.geo.json -o temp/belgium.raw.topo.json
yarn run topoquantize -o temp/belgium.topo.json 10000 temp/belgium.raw.topo.json

# cleanup annotations
node join_data

# teardown
rm -r temp