#!/bin/bash

# Determine OS.
info="$(tput setaf 6)";warning="$(tput setaf 3)Warning: ";error="$(tput setaf 1)Error: ";success="$(tput setaf 2)";reset=$(tput sgr0) # Colors for text
case "${OSTYPE}" in
  darwin*)
    OS="osx";;
  linux*)
    OS="linux";;
  solaris*)
    echo "${warning}solaris OS detected, trying linux solution which may or may not work.${reset}";
    OS="linux";;
  bsd*)
    echo "${warning}bsd OS detected, trying linux solution which may or may not work.${reset}";
    OS="linux";;
  msys*)
    echo "${error}windows OS detected, to use this script on a windows machine, try running it in ubuntu on WSL.${reset}"; print_usage; exit 1;;
  *)
    echo "${warning}unknown OS detected, trying linux solution which may or may not work.${reset}";
    OS="linux";;
esac

# Initialize global variables.
POSTGIS_DB="template_postgis"           # PostGIS template DB (used to create other DBs).
OSM_DB="osm"                            # OSM DB (used to hold OSM data).
DB_USERNAME=$(whoami)                   # Postgres usernam (default is your Mac login).
DB_USERDEF="postgres"                   # Default DB username on Linux installations.

print_intro () {
  echo "This script will install a Postgres database which is from which TileMill will get OSM data that you download and load into the database using the osmload.sh script. The script will also install the Postgis extension that is required by the database and the osm2pgsql database loading tool. This script is only meant to be used when these tools have not already been loaded onto your Mac."
}

print_usage () {
  echo "Usage:"
  echo "    $0                  Install the database and tools."
  echo "    $0 -h               Print help."
  echo "    $0 -u               Uninstall."
}

# Uninstall a previous installation that was done using this script.
uninstall () {
  echo ""
  echo "${warning}This function is only meant to uninstall components that were previously installed by this script. This will include uninstalling postgres, libpng, postgis, osm2pgsql, and any other packages that are unused at the end of this process. If you do not want any of these components uninstalled from your system, you should abort.${reset}"
  echo "Continue with uninstall?[y/n]:";
  read answer
  if [ ${answer} != "y" ]; then
      echo "${error}Aborting.${reset}"; exit 1
  fi
      
  # Stop the database.
  echo ""; echo ""
  echo "${info}$0: Stopping database...${reset}"
  echo "${info}----------------------------------------------------------------------${reset}"
  if [ ${OS} == "linux" ]; then
    sudo service postgresql stop
    sudo update-rc.d postgresql disable
  elif [ ${OS} == "osx" ]; then
    brew services stop postgresql
  fi

  # Uninstall Postgresql database.
  echo ""; echo ""
  echo "${info}$0: Uninstalling Postgres database...${reset}"
  echo "${info}----------------------------------------------------------------------${reset}"
  if [ ${OS} == "linux" ]; then
    for s in $(dpkg -l | grep postgres | cut -d ' ' -f 3)
    do
      sudo apt-get --assume-yes --purge remove $s
    done
  elif [ ${OS} == "osx" ]; then
    brew uninstall postgresql
  fi

  # Uninstall postgis and dependencies.
  echo ""; echo ""
  echo "${info}$0: Uninstalling Postgis database extension...${reset}"
  echo "${info}----------------------------------------------------------------------${reset}"
  if [ ${OS} == "linux" ]; then
    for s in $(dpkg -l | grep postgis | cut -d ' ' -f 3)
    do
      sudo apt-get --assume-yes --purge remove $s
    done
    sudo apt-get --assume-yes --purge remove libpng-dev
  elif [ ${OS} == "osx" ]; then
    brew uninstall libpng postgis
  fi
    
  # Uninstall osm2pgsql.
  echo ""; echo ""
  echo "${inf}o$0: Uninstalling osm2pgsql database loading tool...${reset}"
  echo "${info}----------------------------------------------------------------------${reset}"
  if [ ${OS} == "linux" ]; then
    sudo apt-get --assume-yes --purge remove osm2pgsql
  elif [ ${OS} == "osx" ]; then
    brew uninstall osm2pgsql
  fi

  # Uninstall other unused packages.
  echo ""; echo ""
  echo "${inf}o$0: Uninstalling unused packages...${reset}"
  echo "${info}----------------------------------------------------------------------${reset}"
  if [ ${OS} == "linux" ]; then
    sudo apt --assume-yes autoremove
  fi

  echo ""
  echo "${info}Uninstall complete!${reset}";
}

# Ensure that options and arguments enterered are valid.
if [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
  print_intro; print_usage; exit 1
fi
if [ "$1" == "-u" ]; then
  uninstall; exit 0
fi
if [ "$1" != "" ]; then
  echo "${error}Invalid argument $1.${reset}"; print_usage; exit 1
fi

echo "${success}$0: Starting...${reset}"
echo "${success}----------------------------------------------------------------------${reset}"

# Ensure that installation tools are up to date.
echo ""; echo ""
echo "${info}$0: Updating installation tools...${reset}"
echo "${info}----------------------------------------------------------------------${reset}"
if [ ${OS} == "linux" ]; then
  # Ensure that apt-get is up to date.
  sudo apt-get update
  if [ $? != 0 ]; then
    echo "${error}Update of apt failed. Command:${reset} sudo apt-get update"; exit 1
  fi
elif [ ${OS} == "osx" ]; then
  # Ensure that homebrew is up to date.
  brew update
  if [ $? != 0 ]; then
    echo "${error}Update of apt failed. Command:${reset} brew update"; exit 1
  fi
fi

# Install Postgresql database.
echo ""; echo ""
echo "${info}$0: Installing Postgres database...${reset}"
echo "${info}----------------------------------------------------------------------${reset}"
if [ ${OS} == "linux" ]; then
  sudo apt-get --assume-yes install postgresql postgresql-contrib
  if [ $? != 0 ]; then
    echo "${error}Database installation failed.${reset} Command: sudo apt-get install postgresql postgresql-contrib"; exit 1
  fi
elif [ ${OS} == "osx" ]; then
  brew install postgresql
  if [ $? != 0 ]; then
    echo "${error}Database installation failed.${reset} Command: brew install postgresql"; exit 1
  fi
fi

# Install postgis and dependencies.
echo ""; echo ""
echo "${info}$0: Installing Postgis database extension...${reset}"
echo "${info}----------------------------------------------------------------------${reset}"
if [ ${OS} == "linux" ]; then
  sudo apt-get --assume-yes install libpng-dev postgis
  if [ $? != 0 ]; then
    echo "${error}libpng installation failed. Command:${reset} sudo apt-get install libpng-dev postgis"; exit 1
  fi
elif [ ${OS} == "osx" ]; then
  brew install libpng && brew link -f libpng
  if [ $? != 0 ]; then
    echo "${error}libpng installation failed. Command:${reset} brew install libpng && brew link -f libpng"; exit 1
  fi
  brew install postgis
  if [ $? != 0 ]; then
    echo "${error}Postgis extension installation failed. Command:${reset} brew install postgis"; exit 1
  fi
fi

# Prep and start database.
echo ""; echo ""
echo "${info}$0: Starting database...${reset}"
echo "${info}----------------------------------------------------------------------${reset}"
if [ ${OS} == "linux" ]; then
  sudo update-rc.d postgresql enable
  if [ $? != 0 ]; then
    echo "${error}Database start-prep failed. Command:${reset} sudo update-rc.d postgresql enable"; exit 1
  fi
  sudo service postgresql start
  if [ $? != 0 ]; then
    echo "${error}Database start failed. Command:${reset} sudo service postgresql start"; exit 1
  fi
elif [ ${OS} == "osx" ]; then
  initdb /usr/local/var/postgres/data -E utf8
  if [ $? != 0 ]; then
    echo "${error}Database start-prep failed. Command:${reset} initdb /usr/local/var/postgres -E utf8"; exit 1
  fi
  brew services start postgresql
  if [ $? != 0 ]; then
    echo "${error}Database start failed. Command:${reset} brew services start postgresql"; exit 1
  fi
fi
sleep 5 # give postgres time to start
    
# Initialize database.
echo ""; echo ""
echo "${info}$0: Initializing database for OSM data...${reset}"
echo "${info}----------------------------------------------------------------------${reset}"
if [ ${OS} == "linux" ]; then
  # For linux, need to create a user account matching the logged-in user with necessary permissions.
  # This has to be done from the default root DB user account: postgres.
  sudo su -c "psql -U ${DB_USERDEF} -c \"create user tpotter;\"" postgres
  sudo su -c "psql -U ${DB_USERDEF} -c \"ALTER USER tpotter CREATEDB;\"" postgres
  sudo su -c "psql -U ${DB_USERDEF} -c \"ALTER USER tpotter WITH SUPERUSER;\"" postgres
fi
# Just creating this because it is handy to be able to login to psql without specifying a DB and then to query the DBs.
createdb -U ${DB_USERNAME} ${DB_USERNAME} >& installdb.tmp
if [ $? != 0 ]; then
  # If the error was that the DB already exists, then don't error.
  grep "already exists" installdb.tmp >& /dev/null
  if [ $? != 0 ]; then
    echo "${error}Default database creation failed. Command:${reset} createdb -U ${DB_USERNAME} ${DB_USERNAME}"; exit 1
  fi
fi
createdb -U ${DB_USERNAME} ${POSTGIS_DB} >& installdb.tmp
if [ $? != 0 ]; then
  # If the error was that the DB already exists, then don't error.
  grep "already exists" installdb.tmp >& /dev/null
  if [ $? != 0 ]; then
    echo "${error}PostGIS database creation failed. Command:${reset} createdb -U ${DB_USERNAME} ${POSTGIS_DB}"; rm installdb.tmp; exit 1
  fi
fi
psql -U ${DB_USERNAME} -d ${POSTGIS_DB} -c "create extension postgis;" >& installdb.tmp
if [ $? != 0 ]; then
  # If the error was that the DB already exists, then don't error.
  grep "already exists" installdb.tmp >& /dev/null
  if [ $? != 0 ]; then
    echo "${error}PostGIS extension failed. Command:${reset} psql -U ${DB_USERNAME} -d ${POSTGIS_DB} -c \"create extension postgis;\""; rm installdb.tmp; exit 1
  fi
fi
psql -U ${DB_USERNAME} -d ${POSTGIS_DB} -c "create extension hstore;" >& installdb.tmp
if [ $? != 0 ]; then
  # If the error was that the DB already exists, then don't error.
  grep "already exists" installdb.tmp >& /dev/null
  if [ $? != 0 ]; then
    echo "${error}Hstore extension failed. Command:${reset} psql -U ${DB_USERNAME} -d ${POSTGIS_DB} -c \"create extension hstore;\""; rm installdb.tmp; exit 1
  fi
fi
createdb -U ${DB_USERNAME} ${OSM_DB} -T ${POSTGIS_DB} >& installdb.tmp
if [ $? != 0 ]; then
  # If the error was that the DB already exists, then don't error.
  grep "already exists" installdb.tmp >& /dev/null
  if [ $? != 0 ]; then
    echo "${error}OSM database creation failed. Command:${reset} createdb -U ${DB_USERNAME} ${OSM_DB} -T ${POSTGIS_DB}"; rm installdb.tmp; exit 1
  fi
fi
rm installdb.tmp

# Install osm2pgsql.
echo ""; echo ""
echo "${info}$0: Installing osm2pgsql database loading tool...${reset}"
echo "${info}----------------------------------------------------------------------${reset}"
if [ ${OS} == "linux" ]; then
  sudo apt-get --assume-yes install osm2pgsql
  if [ $? != 0 ]; then
    echo "${error}osm2pgsql installation failed. Command:${reset} sudo apt-get install osm2pgsql"; exit 1
  fi
elif [ ${OS} == "osx" ]; then
  brew install osm2pgsql
  if [ $? != 0 ]; then
    echo "${error}osm2pgsql installation failed. Command:${reset} brew install osm2pgsql"; exit 1
  fi
fi

echo ""; echo ""
echo "${success}----------------------------------------------------------------------${reset}"
echo "${success}$0: Complete!${reset}"
exit 0
