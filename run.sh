#!/usr/bin/env bash
set -euo pipefail

# Reference date of the administrative boundaries (Statbel statistical sectors)
SECTORS_DATE=20250101
# Reference year of the population figures (population on 01/01 of this year)
POP_YEAR=2026

SECTORS_NAME="sh_statbel_statistical_sectors_31370_${SECTORS_DATE}"
SECTORS_URL="https://statbel.fgov.be/sites/default/files/files/opendata/Statistische%20sectoren/${SECTORS_NAME}.geojson.zip"
POP_URL="https://statbel.fgov.be/sites/default/files/files/opendata/bevolking%20naar%20woonplaats%2C%20nationaliteit%20burgelijke%20staat%20%2C%20leeftijd%20en%20geslacht/TF_SOC_POP_STRUCT_${POP_YEAR}.zip"

# setup
npm install
mkdir -p temp

# download source data from Statbel
curl -sL -o temp/sectors.zip "$SECTORS_URL"
unzip -o -q temp/sectors.zip -d temp
curl -sL -o temp/pop.zip "$POP_URL"
unzip -o -q temp/pop.zip -d temp

# dissolve the ~20k statistical sectors into municipalities, arrondissements
# and provinces, reproject from Belgian Lambert 72 to WGS84, simplify and
# write a single quantized topojson with the three layers
npx mapshaper -i "temp/${SECTORS_NAME}.geojson/${SECTORS_NAME}.geojson" \
  -proj wgs84 from=EPSG:31370 \
  -dissolve cd_munty_refnis copy-fields=cd_dstr_refnis,cd_prov_refnis,cd_rgn_refnis,tx_munty_descr_nl,tx_munty_descr_fr,tx_adm_dstr_descr_nl,tx_adm_dstr_descr_fr,tx_prov_descr_nl,tx_prov_descr_fr,tx_rgn_descr_nl,tx_rgn_descr_fr name=municipalities \
  -each 'nis=cd_munty_refnis; name_nl=tx_munty_descr_nl; name_fr=tx_munty_descr_fr; arr_nis=cd_dstr_refnis; arr_nl=tx_adm_dstr_descr_nl; arr_fr=tx_adm_dstr_descr_fr; prov_nis=cd_prov_refnis; prov_nl=tx_prov_descr_nl; prov_fr=tx_prov_descr_fr; reg_nis=cd_rgn_refnis; reg_nl=tx_rgn_descr_nl; reg_fr=tx_rgn_descr_fr; delete cd_munty_refnis; delete cd_dstr_refnis; delete cd_prov_refnis; delete cd_rgn_refnis; delete tx_munty_descr_nl; delete tx_munty_descr_fr; delete tx_adm_dstr_descr_nl; delete tx_adm_dstr_descr_fr; delete tx_prov_descr_nl; delete tx_prov_descr_fr; delete tx_rgn_descr_nl; delete tx_rgn_descr_fr' \
  -dissolve arr_nis copy-fields=arr_nl,arr_fr,prov_nis,prov_nl,prov_fr,reg_nis,reg_nl,reg_fr name=arrondissements + target=municipalities \
  -each target=arrondissements 'nis=arr_nis; name_nl=arr_nl; name_fr=arr_fr; delete arr_nis; delete arr_nl; delete arr_fr' \
  -dissolve prov_nis copy-fields=prov_nl,prov_fr,reg_nis,reg_nl,reg_fr name=provinces + target=municipalities \
  -each target=provinces 'nis=prov_nis; name_nl=prov_nl; name_fr=prov_fr; delete prov_nis; delete prov_nl; delete prov_fr' \
  -simplify 4% keep-shapes \
  -o force temp/belgium.unjoined.json format=topojson bbox quantization=10000 target=municipalities,arrondissements,provinces

# join population data and clean up the properties
node join_data "temp/TF_SOC_POP_STRUCT_${POP_YEAR}.txt"

# teardown
rm -r temp
