#!/bin/sh

# Initialize volatile global variables.
MAPDATA_ROOT="${HOME}/Documents"        # Location of the MapData directory.
#MAPDATA_ROOT="/GoogleDrive"             # Location of the MapData directory.
UTILS_DIR="${HOME}/tilemill/utils"      # Location of the tilemill utils directory.
OSM_DB="osm"                            # Postgres DB for OSM data.
DB_USERNAME=$(whoami)                   # Postgres usernam (default is your Mac login).
STYLE="${UTILS_DIR}/default.style"      # Style file for use by osm2pgsql.
INDEXES_SQL="${UTILS_DIR}/indexes.sql"  # SQL to create indexes.
COUNTS_SQL="${UTILS_DIR}/counts.sql"    # SQL to print out table counts.
info=`tput setaf 6`;error=`tput setaf 1`;success=`tput setaf 2`;reset=`tput sgr0` # Colors for text

print_intro () {
  echo "This script can be used to download OSM data and then load it into your Postgres database. The script downloads the data from http://download.geofabrik.de as a file which it puts into your ${MAPDATA_ROOT}/MapData/OSM directory. It will then load that OSM file into your Postgres database and prepare it for use by TileMill. If you already have an OSM file downloaded, you can run this script to skip the download and to only load a specified file into your Postgres database."
}

print_usage () {
  echo "Usage:"
  echo "    $0 osm-area         Download and load osm-area into database."
  echo "    $0 -h               Print help."
  echo "    $0 -a               List valid osm-areas."
  echo "    $0 -f osm-file      Only load osm-file into database."
}

# Print out a list of the geographies and valid osm-areas that can be used by this script.
print_areas () {
  echo "Valid osm-area values:"
  echo "    geography                                           osm-area"
  echo "    --------------------------------------------------  -------------------------"
  for a in "${AREA[@]}"
  do
    g=${a#*>}             # Get geography from before the ">".
    oa=${a%>*}            # Get osm-area from after the ">".
    l=${#g}               # Get the length of the geography value.
    sp=$(expr 52 - $l)    # Calculate the number of spaces to use between geography and osm-area.
    echo "    $g$(seq  -f "." -s '' $sp)$oa"
  done
}

# For a passed in osm-area, see if it is in the AREA array and if it is, then fill out 
# the GEOGRAPHY variable.
get_geography () {
  osmarea="$1"
  for a in "${AREA[@]}"
  do
    g=${a#*>}             # Get geography from before the ">".
    oa=${a%>*}            # Get osm-area from after the ">".
    if [ "$osmarea" == "$oa" ]; then
      GEOGRAPHY="$g"
      return 0
    fi
  done
  return 1    # OSM_AREA not found in AREA array.
}

# Initialize static global variables.
MAPDATA_DIR="${MAPDATA_ROOT}/MapData/OSM"  # Location where the file will be downloaded or expected to be found. If this is changed, hardcoded values of MapData and OSM will need to be updated in the script below where the directories are being created.
FILE_END="-latest.osm.bz2"                 # Value after the area in the geofabrik file names.
DOMAIN="http://download.geofabrik.de/"     # Geofabrik domain for downloads.
DOWNLOAD_URL=""                            # Variable to hold the full geofabrik URL.
OSM_AREA=""                                # Variable to hold the requested area.
GEOGRAPHY=""                               # Variable to hold the Geography that matches area.
OSM_FILE=""                                # Variable to hold the filename that will be loaded.
# All combinations of geographies and areas that are available from geofabrik (note; some of the long area names were shortened up for convenience).
AREA+=( "africa>africa" )
AREA+=( "algeria>africa/algeria" )
AREA+=( "angola>africa/angola" )
AREA+=( "benin>africa/benin" )
AREA+=( "botswana>africa/botswana" )
AREA+=( "burkina-faso>africa/burkina-faso" )
AREA+=( "burundi>africa/burundi" )
AREA+=( "cameroon>africa/cameroon" )
AREA+=( "canary-islands>africa/canary-islands" )
AREA+=( "cape-verde>africa/cape-verde" )
AREA+=( "central-african-republic>africa/central-african-republic" )
AREA+=( "chad>africa/chad" )
AREA+=( "comores>africa/comores" )
AREA+=( "congo-brazzaville>africa/congo-brazzaville" )
AREA+=( "congo-democratic-republic>africa/congo-democratic-republic" )
AREA+=( "djibouti>africa/djibouti" )
AREA+=( "egypt>africa/egypt" )
AREA+=( "equatorial-guinea>africa/equatorial-guinea" )
AREA+=( "eritrea>africa/eritrea" )
AREA+=( "ethiopia>africa/ethiopia" )
AREA+=( "gabon>africa/gabon" )
AREA+=( "ghana>africa/ghana" )
AREA+=( "guinea>africa/guinea" )
AREA+=( "guinea-bissau>africa/guinea-bissau" )
AREA+=( "ivory-coast>africa/ivory-coast" )
AREA+=( "kenya>africa/kenya" )
AREA+=( "lesotho>africa/lesotho" )
AREA+=( "liberia>africa/liberia" )
AREA+=( "libya>africa/libya" )
AREA+=( "madagascar>africa/madagascar" )
AREA+=( "malawi>africa/malawi" )
AREA+=( "mali>africa/mali" )
AREA+=( "mauritania>africa/mauritania" )
AREA+=( "mauritius>africa/mauritius" )
AREA+=( "morocco>africa/morocco" )
AREA+=( "mozambique>africa/mozambique" )
AREA+=( "namibia>africa/namibia" )
AREA+=( "niger>africa/niger" )
AREA+=( "nigeria>africa/nigeria" )
AREA+=( "rwanda>africa/rwanda" )
AREA+=( "sha-and-tristan-da-cunha>africa/saint-helena-ascension-and-tristan-da-cunha" )
AREA+=( "st-and-principe>africa/sao-tome-and-principe" )
AREA+=( "senegal-and-gambia>africa/senegal-and-gambia" )
AREA+=( "seychelles>africa/seychelles" )
AREA+=( "sierra-leone>africa/sierra-leone" )
AREA+=( "somalia>africa/somalia" )
AREA+=( "south-africa>africa/south-africa" )
AREA+=( "south-africa-and-lesotho>africa/south-africa-and-lesotho" )
AREA+=( "south-sudan>africa/south-sudan" )
AREA+=( "sudan>africa/sudan" )
AREA+=( "swaziland>africa/swaziland" )
AREA+=( "tanzania>africa/tanzania" )
AREA+=( "togo>africa/togo" )
AREA+=( "tunisia>africa/tunisia" )
AREA+=( "uganda>africa/uganda" )
AREA+=( "zambia>africa/zambia" )
AREA+=( "zimbabwe>africa/zimbabwe" )
AREA+=( "asia>asia" )
AREA+=( "afghanistan>asia/afghanistan" )
AREA+=( "armenia>asia/armenia" )
AREA+=( "azerbaijan>asia/azerbaijan" )
AREA+=( "bangladesh>asia/bangladesh" )
AREA+=( "bhutan>asia/bhutan" )
AREA+=( "cambodia>asia/cambodia" )
AREA+=( "china>asia/china" )
AREA+=( "gcc-states>asia/gcc-states" )
AREA+=( "india>asia/india" )
AREA+=( "indonesia>asia/indonesia" )
AREA+=( "iran>asia/iran" )
AREA+=( "iraq>asia/iraq" )
AREA+=( "israel-and-palestine>asia/israel-and-palestine" )
AREA+=( "japan>asia/japan" )
AREA+=( "jordan>asia/jordan" )
AREA+=( "kazakhstan>asia/kazakhstan" )
AREA+=( "kyrgyzstan>asia/kyrgyzstan" )
AREA+=( "laos>asia/laos" )
AREA+=( "lebanon>asia/lebanon" )
AREA+=( "malaysia-singapore-brunei>asia/malaysia-singapore-brunei" )
AREA+=( "maldives>asia/maldives" )
AREA+=( "mongolia>asia/mongolia" )
AREA+=( "myanmar>asia/myanmar" )
AREA+=( "nepal>asia/nepal" )
AREA+=( "north-korea>asia/north-korea" )
AREA+=( "pakistan>asia/pakistan" )
AREA+=( "philippines>asia/philippines" )
AREA+=( "south-korea>asia/south-korea" )
AREA+=( "sri-lanka>asia/sri-lanka" )
AREA+=( "syria>asia/syria" )
AREA+=( "taiwan>asia/taiwan" )
AREA+=( "tajikistan>asia/tajikistan" )
AREA+=( "thailand>asia/thailand" )
AREA+=( "turkmenistan>asia/turkmenistan" )
AREA+=( "uzbekistan>asia/uzbekistan" )
AREA+=( "vietnam>asia/vietnam" )
AREA+=( "yemen>asia/yemen" )
AREA+=( "australia-oceania>australia-oceania" )
AREA+=( "australia>australia-oceania/australia" )
AREA+=( "fiji>australia-oceania/fiji" )
AREA+=( "new-caledonia>australia-oceania/new-caledonia" )
AREA+=( "new-zealand>australia-oceania/new-zealand" )
AREA+=( "papua-new-guinea>australia-oceania/papua-new-guinea" )
AREA+=( "central-america>central-america" )
AREA+=( "belize>central-america/belize" )
AREA+=( "cuba>central-america/cuba" )
AREA+=( "guatemala>central-america/guatemala" )
AREA+=( "haiti-and-domrep>central-america/haiti-and-domrep" )
AREA+=( "jamaica>central-america/jamaica" )
AREA+=( "nicaragua>central-america/nicaragua" )
AREA+=( "europe>europe" )
AREA+=( "albania>europe/albania" )
AREA+=( "alps>europe/alps" )
AREA+=( "andorra>europe/andorra" )
AREA+=( "austria>europe/austria" )
AREA+=( "azores>europe/azores" )
AREA+=( "belarus>europe/belarus" )
AREA+=( "belgium>europe/belgium" )
AREA+=( "bosnia-herzegovina>europe/bosnia-herzegovina" )
AREA+=( "british-isles>europe/british-isles" )
AREA+=( "bulgaria>europe/bulgaria" )
AREA+=( "croatia>europe/croatia" )
AREA+=( "cyprus>europe/cyprus" )
AREA+=( "czech-republic>europe/czech-republic" )
AREA+=( "dach>europe/dach" )
AREA+=( "denmark>europe/denmark" )
AREA+=( "estonia>europe/estonia" )
AREA+=( "faroe-islands>europe/faroe-islands" )
AREA+=( "finland>europe/finland" )
AREA+=( "france>europe/france" )
AREA+=( "georgia-europe>europe/georgia" )
AREA+=( "germany>europe/germany" )
AREA+=( "great-britain>europe/great-britain" )
AREA+=( "greece>europe/greece" )
AREA+=( "hungary>europe/hungary" )
AREA+=( "iceland>europe/iceland" )
AREA+=( "ireland-and-n-ireland>europe/ireland-and-northern-ireland" )
AREA+=( "isle-of-man>europe/isle-of-man" )
AREA+=( "italy>europe/italy" )
AREA+=( "kosovo>europe/kosovo" )
AREA+=( "latvia>europe/latvia" )
AREA+=( "liechtenstein>europe/liechtenstein" )
AREA+=( "lithuania>europe/lithuania" )
AREA+=( "luxembourg>europe/luxembourg" )
AREA+=( "macedonia>europe/macedonia" )
AREA+=( "malta>europe/malta" )
AREA+=( "moldova>europe/moldova" )
AREA+=( "monaco>europe/monaco" )
AREA+=( "montenegro>europe/montenegro" )
AREA+=( "netherlands>europe/netherlands" )
AREA+=( "norway>europe/norway" )
AREA+=( "poland>europe/poland" )
AREA+=( "portugal>europe/portugal" )
AREA+=( "romania>europe/romania" )
AREA+=( "serbia>europe/serbia" )
AREA+=( "slovakia>europe/slovakia" )
AREA+=( "slovenia>europe/slovenia" )
AREA+=( "spain>europe/spain" )
AREA+=( "sweden>europe/sweden" )
AREA+=( "switzerland>europe/switzerland" )
AREA+=( "turkey>europe/turkey" )
AREA+=( "ukraine>europe/ukraine" )
AREA+=( "north-america>north-america" )
AREA+=( "north-america>north-america" )
AREA+=( "canada>north-america/canada" )
AREA+=( "alberta>north-america/canada/alberta" )
AREA+=( "british-columbia>north-america/canada/british-columbia" )
AREA+=( "manitoba>north-america/canada/manitoba" )
AREA+=( "new-brunswick>north-america/canada/new-brunswick" )
AREA+=( "newfoundland-and-labrador>north-america/canada/newfoundland-and-labrador" )
AREA+=( "northwest-territories>north-america/canada/northwest-territories" )
AREA+=( "nova-scotia>north-america/canada/nova-scotia" )
AREA+=( "nunavut>north-america/canada/nunavut" )
AREA+=( "ontario>north-america/canada/ontario" )
AREA+=( "prince-edward-island>north-america/canada/prince-edward-island" )
AREA+=( "quebec>north-america/canada/quebec" )
AREA+=( "saskatchewan>north-america/canada/saskatchewan" )
AREA+=( "yukon>north-america/canada/yukon" )
AREA+=( "greenland>north-america/greenland" )
AREA+=( "mexico>north-america/mexico" )
AREA+=( "us-midwest>north-america/us-midwest" )
AREA+=( "us-northeast>north-america/us-northeast" )
AREA+=( "us-pacific>north-america/us-pacific" )
AREA+=( "us-south>north-america/us-south" )
AREA+=( "us-west>north-america/us-west" )
AREA+=( "alabama>north-america/us/alabama" )
AREA+=( "alaska>north-america/us/alaska" )
AREA+=( "arizona>north-america/us/arizona" )
AREA+=( "arkansas>north-america/us/arkansas" )
AREA+=( "california>north-america/us/california" )
AREA+=( "colorado>north-america/us/colorado" )
AREA+=( "connecticut>north-america/us/connecticut" )
AREA+=( "delaware>north-america/us/delaware" )
AREA+=( "district-of-columbia>north-america/us/district-of-columbia" )
AREA+=( "florida>north-america/us/florida" )
AREA+=( "georgia>north-america/us/georgia" )
AREA+=( "hawaii>north-america/us/hawaii" )
AREA+=( "idaho>north-america/us/idaho" )
AREA+=( "illinois>north-america/us/illinois" )
AREA+=( "indiana>north-america/us/indiana" )
AREA+=( "iowa>north-america/us/iowa" )
AREA+=( "kansas>north-america/us/kansas" )
AREA+=( "kentucky>north-america/us/kentucky" )
AREA+=( "louisiana>north-america/us/louisiana" )
AREA+=( "maine>north-america/us/maine" )
AREA+=( "maryland>north-america/us/maryland" )
AREA+=( "massachusetts>north-america/us/massachusetts" )
AREA+=( "michigan>north-america/us/michigan" )
AREA+=( "minnesota>north-america/us/minnesota" )
AREA+=( "mississippi>north-america/us/mississippi" )
AREA+=( "missouri>north-america/us/missouri" )
AREA+=( "montana>north-america/us/montana" )
AREA+=( "nebraska>north-america/us/nebraska" )
AREA+=( "nevada>north-america/us/nevada" )
AREA+=( "new-hampshire>north-america/us/new-hampshire" )
AREA+=( "new-jersey>north-america/us/new-jersey" )
AREA+=( "new-mexico>north-america/us/new-mexico" )
AREA+=( "new-york>north-america/us/new-york" )
AREA+=( "north-carolina>north-america/us/north-carolina" )
AREA+=( "north-dakota>north-america/us/north-dakota" )
AREA+=( "ohio>north-america/us/ohio" )
AREA+=( "oklahoma>north-america/us/oklahoma" )
AREA+=( "oregon>north-america/us/oregon" )
AREA+=( "pennsylvania>north-america/us/pennsylvania" )
AREA+=( "puerto-rico>north-america/us/puerto-rico" )
AREA+=( "rhode-island>north-america/us/rhode-island" )
AREA+=( "south-carolina>north-america/us/south-carolina" )
AREA+=( "south-dakota>north-america/us/south-dakota" )
AREA+=( "tennessee>north-america/us/tennessee" )
AREA+=( "texas>north-america/us/texas" )
AREA+=( "utah>north-america/us/utah" )
AREA+=( "vermont>north-america/us/vermont" )
AREA+=( "virginia>north-america/us/virginia" )
AREA+=( "washington>north-america/us/washington" )
AREA+=( "west-virginia>north-america/us/west-virginia" )
AREA+=( "wisconsin>north-america/us/wisconsin" )
AREA+=( "wyoming>north-america/us/wyoming" )
AREA+=( "russia>russia" )
AREA+=( "central-russia>russia/central-fed-district" )
AREA+=( "crimea>russia/crimean-fed-district" )
AREA+=( "far-eastern-russia>russia/far-eastern-fed-district" )
AREA+=( "kaliningrad>russia/kaliningrad" )
AREA+=( "north-caucasus>russia/north-caucasus-fed-district" )
AREA+=( "northwestern-russia>russia/northwestern-fed-district" )
AREA+=( "siberia>russia/siberian-fed-district" )
AREA+=( "south-russia>russia/south-fed-district" )
AREA+=( "urals>russia/ural-fed-district" )
AREA+=( "volga>russia/volga-fed-district" )
AREA+=( "south-america>south-america" )
AREA+=( "argentina>south-america/argentina" )
AREA+=( "bolivia>south-america/bolivia" )
AREA+=( "brazil>south-america/brazil" )
AREA+=( "chile>south-america/chile" )
AREA+=( "colombia>south-america/colombia" )
AREA+=( "ecuador>south-america/ecuador" )
AREA+=( "paraguay>south-america/paraguay" )
AREA+=( "peru>south-america/peru" )
AREA+=( "suriname>south-america/suriname" )
AREA+=( "uruguay>south-america/uruguay" )
AREA+=( "venezuela>south-america/venezuela" )

# Ensure that options and arguments enterered are valid.
if [ "$1" == "--help" ]; then
  print_intro; print_usage; exit 1
fi
while getopts ":haf:" opt; do
  case ${opt} in
    h ) print_intro; print_usage; exit 1;;
    a ) print_areas; exit 1;;
    f ) 
      if [ "$3" != "" ]; then
        echo "${error}Error: Invalid argument $3.${reset}"; print_usage; exit 1
      fi
      OSM_FILE="$OPTARG"
      if [ ! -e ${MAPDATA_DIR}/${OSM_FILE} ]; then
        echo "${error}Error: osm-file ${MAPDATA_DIR}/${OSM_FILE} does not exist.${reset}"; print_usage; exit 1
      fi
      ;;
    \? ) echo "${error}Error: Invalid option.${reset}"; print_usage; exit 1;;
  esac
done
if [ "$OSM_FILE" == "" ]; then
  if [ "$1" == "-f" ]; then
    echo "${error}Error: osm-file required with -f option.${reset}"; print_usage; exit 1
  fi
  if [ "$1" == "" ]; then
    echo "${error}Error: osm-area required.${reset}"; print_usage; exit 1
  fi
  if [ "$2" != "" ]; then
    echo "${error}Error: Invalid argument $2.${reset}"; print_usage; exit 1
  fi
  get_geography "$1"
  if [ $? != 0 ]; then
    echo "${error}Error: Invalid osm-area $1.${reset}"; print_usage; exit 1
  fi
  OSM_AREA="$1"
fi

echo "${success}$0: Starting...${reset}"
echo "${success}----------------------------------------------------------------------${reset}"
cd ${UTILS_DIRECTORY}

# Create the MapData/OSM directory if it is not already there.
if [ ! -d ${MAPDATA_ROOT}/MapData/OSM ]; then
  echo ""; echo ""
  echo "${info}$0: Creating ${MAPDATA_ROOT}/MapData/OSM directory if not already there...${reset}"
  echo "${info}----------------------------------------------------------------------${reset}"
  if [ ! -d ${MAPDATA_ROOT} ]; then
    echo "${error}Error: Expected ${MAPDATA_ROOT} directory to exist.${reset}"; exit 1
  fi
  if [ ! -d ${MAPDATA_ROOT}/MapData ]; then
    mkdir ${MAPDATA_ROOT}/MapData
    if [ $? != 0 ]; then
      echo "${error}Error: Creation of directory failed. Command:${reset} mkdir ${MAPDATA_ROOT}/MapData"; exit 1
    fi
  fi
  if [ ! -d ${MAPDATA_ROOT}/MapData/OSM ]; then
    mkdir ${MAPDATA_ROOT}/MapData/OSM
    if [ $? != 0 ]; then
      echo "${error}Error: Creation of directory failed. Command:${reset} mkdir ${MAPDATA_ROOT}/MapData/OSM"; exit 1
    fi
  fi
fi

# Download the OSM data if they did not want to only do the database load.
if [ "${OSM_FILE}" == "" ]; then
  oa=$(echo ${GEOGRAPHY} | sed 's/.*\///')  # Get osm-area from after the "/".
  OSM_FILE="${oa}${FILE_END}"
  DOWNLOAD_URL="${DOMAIN}${GEOGRAPHY}${FILE_END}"

  # Save a backup of a file with the same name before we do the download.
  if [ -e ${MAPDATA_DIR}/${OSM_FILE} ]; then
    echo ""; echo ""
    echo "${info}$0: Saving a copy of the existing file with a .prev extension.${reset}"
    echo "${info}----------------------------------------------------------------------${reset}"
    mv ${MAPDATA_DIR}/${OSM_FILE} ${MAPDATA_DIR}/${OSM_FILE}.prev
    if [ $? != 0 ]; then
      echo "${error}Error: Rename of file failed. Command:${reset} mv ${MAPDATA_DIR}/${OSM_FILE} ${MAPDATA_DIR}$/{OSM_FILE}.prev"; exit 1
    fi
  fi

  # Download the file.
  echo ""; echo ""
  echo "${info}$0: Downloading the file ${MAPDATA_DIR}${OSM_FILE} from ${DOWNLOAD_URL}...${reset}"
  echo "${info}----------------------------------------------------------------------${reset}"
  curl ${DOWNLOAD_URL} > ${MAPDATA_DIR}/${OSM_FILE}
  if [ $? != 0 ]; then
    echo "${error}Error: Download of file failed. Command:${reset} curl ${DOWNLOAD_URL} > ${MAPDATA_DIR}/${OSM_FILE}"; exit 1
  fi
fi

# Load the data into Postgres.
echo ""; echo ""
echo "${info}$0: Loading the data into the Postgres database...${reset}"
echo "${info}----------------------------------------------------------------------${reset}"
osm2pgsql --create --multi-geometry --database ${OSM_DB} --username ${DB_USERNAME} --style ${STYLE} --hstore ${MAPDATA_DIR}/${OSM_FILE}
if [ $? != 0 ]; then
  echo "${error}Error: Load of OSM data into database failed. Command:${reset} osm2pgsql --create --multi-geometry --database ${OSM_DB} --username ${DB_USERNAME} --style ${STYLE} --hstore ${MAPDATA_DIR}/${OSM_FILE}"; exit 1
fi

# Create indexes for better TileMill performance.
echo ""; echo ""
echo "${info}$0: Creating indexes in database for better TileMill performance...${reset}"
echo "${info}----------------------------------------------------------------------${reset}"
psql -d ${OSM_DB} -U ${DB_USERNAME} -a -f ${INDEXES_SQL}
if [ $? != 0 ]; then
  echo "${error}Error: Index creation failed. Command:${reset} psql -d ${OSM_DB} -U ${DB_USERNAME} -a -f ${INDEXES_SQL}"; exit 1
fi

# Print out table counts.
echo ""; echo ""
echo "${info}$0: Printing out database table counts...${reset}"
echo "${info}----------------------------------------------------------------------${reset}"
psql -d ${OSM_DB} -U ${DB_USERNAME} -a -f ${COUNTS_SQL}
if [ $? != 0 ]; then
  echo "${error}Error: Table counts failed. Command:${reset} psql -d ${OSM_DB} -U ${DB_USERNAME} -a -f ${COUNTS_SQL}"; exit 1
fi

echo ""; echo ""
echo "${success}----------------------------------------------------------------------${reset}"
echo "${success}$0: Complete!${reset}"
exit 0