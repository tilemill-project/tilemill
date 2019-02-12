#!/bin/sh

# Initialize global variables.
UTILS_DIR="${HOME}/tilemill/utils"      # Location of the tilemill utils directory.
POSTGIS_DB="template_postgis"           # PostGIS template DB (used to create other DBs).
OSM_DB="osm"                            # OSM DB (used to hold OSM data).
DB_USERNAME=$(whoami)                   # Postgres usernam (default is your Mac login).
X900913_SQL="${UTILS_DIR}/900913.sql"   # SQL for 900913 projection.
LEGACY_POSTGIS_SQL="${UTILS_DIR}/legacy-postgis-gist.sql"  # SQL for legacy postgis operators.
info=`tput setaf 6`;error=`tput setaf 1`;success=`tput setaf 2`;reset=`tput sgr0` # Colors for text

print_intro () {
  echo "This script will install a Postgres database which is from which TileMill will get OSM data that you download and load into the database using the osmload.sh script. The script will also install the Postgis extension that is required by the database and the osm2pgsql database loading tool. This script is only meant to be used when these tools have not already been loaded onto your Mac."
}

print_usage () {
  echo "Usage:"
  echo "    $0                  Install the database and tools."
  echo "    $0 -h               Print help."
}

# Ensure that options and arguments enterered are valid.
if [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
  print_intro; print_usage; exit 1
fi
if [ "$1" != "" ]; then
  echo "${error}$0 Error: Invalid argument $1.${reset}"; print_usage; exit 1
fi

echo "${success}$0: Starting...${reset}"
echo "${success}----------------------------------------------------------------------${reset}"
cd ${TILEMILL_DIR}

# Install Postgresql database.
echo ""; echo ""
echo "${info}$0: Installing Postgres database...${reset}"
echo "${info}----------------------------------------------------------------------${reset}"
brew install postgresql
if [ $? != 0 ]; then
  echo "${error}$0 Error: Database installation failed.${reset} Command: brew install postgresql"; exit 1
fi

# Install postgis and dependencies.
echo ""; echo ""
echo "${info}$0: Installing Postgis database extension...${reset}"
echo "${info}----------------------------------------------------------------------${reset}"
brew install libpng && brew link -f libpng
if [ $? != 0 ]; then
  echo "${error}$0 Error: libpng installation failed. Command:${reset} brew install libpng && brew link -f libpng"; exit 1
fi
brew install postgis
if [ $? != 0 ]; then
  echo "${error}$0 Error: Postgis extension installation failed. Command:${reset} brew install postgis"; exit 1
fi

# Initialize database.
echo ""; echo ""
echo "${info}$0: Initializing database for OSM data...${reset}"
echo "${info}----------------------------------------------------------------------${reset}"
initdb /usr/local/var/postgres/data -E utf8
if [ $? != 0 ]; then
  echo "${error}$0 Error: Database initialization failed. Command:${reset} initdb /usr/local/var/postgres -E utf8"; exit 1
fi
brew services start postgresql
if [ $? != 0 ]; then
  echo "${error}$0 Error: Database start failed. Command:${reset} brew services start postgresql"; exit 1
fi
sleep 10 # give postgres time to start
# Just creating this because it is handy to be able to login to psql without specifying a DB and then to query the DBs.
createdb -U ${DB_USERNAME} ${DB_USERNAME}
if [ $? != 0 ]; then
  echo "${error}$0 Error: Default database creation failed. Command:${reset} createdb -U ${DB_USERNAME} ${DB_USERNAME}"; exit 1
fi
createdb -U ${DB_USERNAME} ${POSTGIS_DB}
if [ $? != 0 ]; then
  echo "${error}$0 Error: PostGIS database creation failed. Command:${reset} createdb -U ${DB_USERNAME} ${POSTGIS_DB}"; exit 1
fi
psql -U ${DB_USERNAME} -d ${POSTGIS_DB} -c "create extension postgis;"
if [ $? != 0 ]; then
  echo "${error}$0 Error: PostGIS extension failed. Command:${reset} psql -U ${DB_USERNAME} -d ${POSTGIS_DB} -c "create extension postgis;""; exit 1
fi
psql -U ${DB_USERNAME} -d ${POSTGIS_DB} -c "create extension hstore;"
if [ $? != 0 ]; then
  echo "${error}$0 Error: Hstore extension failed. Command:${reset} psql -U ${DB_USERNAME} -d ${POSTGIS_DB} -c "create extension hstore;""; exit 1
fi
createdb -U ${DB_USERNAME} ${OSM_DB} -T ${POSTGIS_DB}
if [ $? != 0 ]; then
  echo "${error}$0 Error: OSM database creation failed. Command:${reset} createdb -U ${DB_USERNAME} ${OSM_DB} -T ${POSTGIS_DB}"; exit 1
fi

# Install osm2pgsql.
echo ""; echo ""
echo "${info}$0: Installing osm2pgsql database loading tool...${reset}"
echo "${info}----------------------------------------------------------------------${reset}"
brew install osm2pgsql
if [ $? != 0 ]; then
  echo "${error}$0 Error: Database installation failed. Command:${reset} brew install osm2pgsql"; exit 1
fi

echo ""; echo ""
echo "${success}----------------------------------------------------------------------${reset}"
echo "${success}$0: Complete!${reset}"
exit 0