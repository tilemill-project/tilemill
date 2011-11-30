#!/bin/bash
set -e -u

# Requirements:
# - MillPrep: https://github.com/mapbox/millprep
# - ImageMagick
# - OptiPNG
# - base64

# To create the countries-interaction layer:
# Get a copy of the 1:50M scale Natural Earth admin 0 countries file and run
# `millprep.py --sqlite ne_50m_admin_0_countries.shp`

db="layers/ne_50m_admin_0_countries_millready.sqlite"
table="ne_50m_admin_0_countries"

echo "Converting SVGs to PNGs... "
mogrify -resize 100x100 -colors 64 -format png flags/*.svg

echo "Optimizing PNGs... "
optipng -quiet flags/*.png

echo "Updating SQLite table with base64-encoded flag data... "

sqlite3 $db "PRAGMA table_info(ne_50m_admin_0_countries);" \
  | grep -i 'flag_png|text' > /dev/null \
  || sqlite3 $db "ALTER TABLE $table ADD COLUMN flag_png text;"

for flagpng in flags/*.png; do
  adm0_a3="$(basename $flagpng .png)"
  flagdata="$(base64 -w0 $flagpng)"
  sqlite3 $db "UPDATE $table SET flag_png = '$flagdata' WHERE adm0_a3 = '$adm0_a3';"
done

echo "Done."
