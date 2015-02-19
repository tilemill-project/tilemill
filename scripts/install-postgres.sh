#!/usr/bin/env bash
set -eu

if [ ! -d ~/.mason/ ]; then
    git clone https://github.com/mapbox/mason.git ~/.mason
fi

PLATFORM=$(uname -s | sed "y/ABCDEFGHIJKLMNOPQRSTUVWXYZ/abcdefghijklmnopqrstuvwxyz/")
if [ $PLATFORM == "linux" ]; then
    sudo apt-get install clang-3.3
fi

# setup config
echo 'export PGDATA=$(pwd)/local-postgres' > mason-config.env
echo 'export PGHOST=$(pwd)/local-unix-socket' >> mason-config.env
echo 'export PGTEMP_DIR=$(pwd)/local-tmp' >> mason-config.env
echo 'export PGPORT=1111' >> mason-config.env
echo 'export PATH=$(pwd)/mason_packages/.link/bin/:${PATH}' >> mason-config.env
echo 'export GDAL_DATA=$(~/.mason/mason prefix gdal 1.11.1-big-pants)/share/gdal/' >> mason-config.env

# do each time you use the local postgis:
source mason-config.env

# do once: install stuff
~/.mason/mason build postgis 2.1.5
~/.mason/mason link postgres 9.4.0

# # do once: create directories to hold postgres data
mkdir -p ${PGTEMP_DIR}
mkdir -p ${PGHOST}

# do once: initialize local db cluster
./mason_packages/.link/bin/initdb -D $PGDATA
sleep 2

# do each time you use this local postgis:
# start server and background (NOTE: hit return to fully background and get your prompt back)
./mason_packages/.link/bin/postgres -k $PGHOST > postgres.log &
sleep 2

# set up postgres to know about local temp directory
./mason_packages/.link/bin/psql postgres -c "CREATE TABLESPACE temp_disk LOCATION '${PGTEMP_DIR}';"
./mason_packages/.link/bin/psql postgres -c "SET temp_tablespaces TO 'temp_disk';"

# create postgis enabled db
./mason_packages/.link/bin/createdb template_postgis -T postgres
./mason_packages/.link/bin/psql template_postgis -c "CREATE EXTENSION postgis;"
./mason_packages/.link/bin/psql template_postgis -c "SELECT PostGIS_Full_Version();"
