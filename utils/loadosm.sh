#!/bin/bash

# Record the start time.
START=`date +%s`

# Initialize volatile global variables.
MAPDATA_ROOT="${HOME}/Documents/MapBox"    # Default location of the map data directory.
CONFIG="${HOME}/.tilemill/config.json"     # Tilemill config file to override defaults.
UTILS_DIR="$(pwd)"                         # Location of the tilemill utils directory.
DB_HOST="tilemilldev.cuveite2ttso.us-east-2.rds.amazonaws.com" # Postgres DB host on AWS RDS.
DB_PORT="5432"                             # Postgres DB port on AWS RDS.
#DB_USERNAME=$(whoami)                      # Postgres usernam (default is your Mac login).
DB_USERNAME="postgresql"                   # Postgres usernam (default is your Mac login).
OSM_DB="osm"                               # Postgres DB for OSM data.
OSM2PGSQL_OPTIONS="--slim --cache 500 --password" # Options to use on the osm2pgsql call.
STYLE="default.style"                      # Style file for use by osm2pgsql.
INDEXES_SQL="${UTILS_DIR}/indexes.sql"     # SQL to create indexes.
COUNTS_SQL="${UTILS_DIR}/counts.sql"       # SQL to print out table counts.
info=`tput setaf 6`;error=`tput setaf 1`;success=`tput setaf 2`;reset=`tput sgr0` # Colors for text

print_intro () {
  echo ""
  echo "This script will download OSM data and load it into a Postgres database. The script either downloads a pre-defined area (from geofabrik) or it does a custom download (using overpass) based on a bounding box that you define. The script loads the OSM file into your Postgres database as a new data load (deleting previous OSM data) and prepares it for use by TileMill. If you already have an OSM file downloaded, you can run this script to only load that file with no download."
}

print_usage () {
  echo ""
  echo "Usage:"
  echo "    $0 [-n] [-d data-dir] -a osm-area    Download pre-defined OSM-area (default: load into DB)."
  echo "    $0 [-n] [-d data-dir] -a osm-area -b bounding-box"
  echo "                                         Download custom OSM-area (default: load into DB)."
  echo "    $0 [-d data-dir] -f osm-file         Load osm-file into DB (no OSM data download)."
  echo "    $0 -h"
  echo "    $0 -l"
  echo ""
  echo "Command Options:"
  echo "    -a    Either the name of a pre-defined OSM area (see -l for area names) or"
  echo "          a name that should be used to describe a custom OSM area (see -b)."
  echo "          Must not contain spaces or special characters other than '-' or '_'."
  echo "    -b    Bounding box that should be used for a custom area definition."
  echo "          Bounding box format: 'minLatitude,minLongitude,maxLatitude,maxLongitude'"
  echo "                               (i.e. 'South,West,North,East')."
  echo "                               (e.g. '47.5985,-122.3382,47.6635,-122.27')"
  echo "    -d    Directory where downloaded OSM data file should be stored."
  echo "          Default location is: ${MAPDATA_ROOT}/${DATA_DIR}/${OSM_DIR}"
  echo "    -f    OSM file to load into database (no download)."
  echo "    -h    Print help."
  echo "    -l    Print list of valid pre-defined OSM areas."
  echo "    -n    No DB load, download the OSM data only, do not load into the database."
  echo ""
}

# Print out a list of the geographies and valid osm-areas that can be used by this script.
print_areas () {
  echo ""
  echo "Valid osm-area values:"
  echo "    geography                                           osm-area"
  echo "    --------------------------------------------------  -------------------------"
  for a in "${AREA[@]}"
  do
    g=${a#*>}             # Get geography from before the ">".
    oa=${a%>*}            # Get osm-area from after the ">".
    l=${#g}               # Get the length of the geography value.
    sp=$(expr 53 - $l)    # Calculate the number of spaces to use between geography and osm-area.
    echo "    $g$(seq -s. $sp | tr -d '[:digit:]')$oa"
  done
  echo ""
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
DATA_DIR="data"
OSM_DIR="osm"
MAPDATA_DIR=""                        # Location where the file will be downloaded or is expected 
                                      # to be found.
GEOFABRIK_URL_START="http://download.geofabrik.de/" # Start of geofabrik URL for downloads.
GEOFABRIK_FILE_END="-latest.osm.pbf"  # Value after the area in the geofabrik file names.
OVERPASS_URL_START="http://overpass-api.de/api/interpreter?(" # Start of overpass URL/query.
OVERPASS_URL_END=");out;"             # End of overpass URL/query.
OVERPASS_FILE_END="-latest.osm"       # Value to use for a file downloaded from overpass.
DOWNLOAD_URL=""                       # Variable to hold the full URL.
OSM_AREA=""                           # Variable to hold the requested area.
GEOGRAPHY=""                          # Variable to hold the Geography that matches area.
BOUNDING_BOX=""                       # Variable to hold a custom area bounding box definition.
OSM_FILE=""                           # Variable to hold the filename that will be loaded.
DOWNLOAD_DATA="false"                 # Flag to indicate if an OSM file should be downloaded.
LOAD_DB="true"                        # Flag to indicate if the file should be loaded into the 
                                      # database.
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

# Update the MAPDATA_ROOT if they have a configured root path.
if [ -e ${CONFIG} ]; then
  temp="$(grep -F "\"files\":" ${CONFIG} | cut -d "/" -f2- | cut -d "\"" -f1)"
  if [ "${temp}" != "" ]; then
    MAPDATA_ROOT="/${temp}"
  fi
fi

# Ensure that options and arguments enterered are valid.
if [ "$1" == "--help" ]; then
  print_intro; print_usage; exit 1
fi
while getopts "hlna:b:d:f:" opt; do
  case ${opt} in
    h ) print_intro; print_usage; exit 1;;
    l ) print_areas; exit 1;;
    n )
      LOAD_DB="false"
      ;;
    a ) 
      OSM_AREA="$OPTARG"
      if ! [[ "${OSM_AREA}" =~ ^[a-zA-Z0-9_-]+$ ]]; then
        echo "${error}Error: osm-area ${OSM_AREA} may only contain alphanumeric '-' or '_' characters.${reset}"; print_usage; exit 1
      fi
      ;;
    b )
      BOUNDING_BOX="$OPTARG"
      if ! [[ "$BOUNDING_BOX" =~ ^-?[0-9]+\.[0-9]+,-?[0-9]+\.[0-9]+,-?[0-9]+\.[0-9]+,-?[0-9]+\.[0-9]+$ ]]; then
        echo "${error}Error: Invalid format for bounding-box '${BOUNDING_BOX}'.${reset}"; print_usage; exit 1
      fi
      ;;
    d ) 
      MAPDATA_DIR="$OPTARG"
      if [ ! -d "${MAPDATA_DIR}" ]; then
        echo "${error}Error: data-dir ${MAPDATA_DIR} does not exist.${reset}"; print_usage; exit 1
      fi
      ;;
    f ) 
      OSM_FILE="$OPTARG"
      ;;
    \? ) echo "${error}Error: Invalid option.${reset}"; print_usage; exit 1;;
  esac
done
# Make sure there are no remaining arguments after processing the options.
shift $(($OPTIND - 1))
remaining_args="$@"
if [ "${remaining_args}" != "" ] ; then
  echo "${error}Error: Invalid argument ${remaining_args}.${reset}"; print_usage; exit 1
fi
# Make sure that they did not combine arguments that cannot be combined.
if [ "${LOAD_DB}" == "false" ] && [ "${OSM_FILE}" != "" ]; then
  echo "${error}Error: -n not falid with -f.${reset}"; print_usage; exit 1
fi
# Do validation of the options that have been selected and setup variables for processing.
if [ "${OSM_FILE}" == "" ]; then # -f NOT specified
  if [ "${OSM_AREA}" == "" ]; then # -a NOT specified
    echo "${error}Error: Must specify either -a, -f, -h, or -l.${reset}"; print_usage; exit 1
  else # -a specified
    if [ "${BOUNDING_BOX}" == "" ]; then # -b NOT specified
      # Only -a is specified so setup for a geofabrik download and a file load into the database. 
      # Start by finding the pre-defined area name from the user specified OSM-area.
      get_geography "$OSM_AREA"
      if [ $? != 0 ]; then
        echo "${error}Error: Invalid osm-area ${OSM_AREA}.${reset}"; print_usage; exit 1
      fi
      DOWNLOAD_DATA="true"
      # Build the download URL and file name that should be used.
      DOWNLOAD_URL="${GEOFABRIK_URL_START}${GEOGRAPHY}${GEOFABRIK_FILE_END}"
      oa=$(echo ${GEOGRAPHY} | sed 's/.*\///')  # Get osm-area from after the "/".
      OSM_FILE="${oa}${GEOFABRIK_FILE_END}"
    else # -a and -b specified
      # Both -a and -b are specified so setup for an overpass download and a file load 
      # into the database.
      DOWNLOAD_DATA="true"
      # Build the download URL and file name that should be used.
      OVERPASS_URL_MIDDLE="node(${BOUNDING_BOX});way(${BOUNDING_BOX});relation(${BOUNDING_BOX});"
      DOWNLOAD_URL="${OVERPASS_URL_START}${OVERPASS_URL_MIDDLE}${OVERPASS_URL_END}"
      OSM_FILE="${OSM_AREA}${OVERPASS_FILE_END}"
    fi
  fi
else # -f specified
  if [ "${MAPDATA_DIR}" == "" ]; then # -f specified and -d NOT specified
    # Make sure that the file exists.
    if [ ! -e "${MAPDATA_ROOT}/${DATA_DIR}/${OSM_DIR}/${OSM_FILE}" ]; then
      echo "${error}Error: osm-file ${MAPDATA_ROOT}/${DATA_DIR}/${OSM_DIR}/${OSM_FILE} does not exist.${reset}"; print_usage; exit 1
    fi
  else  # -f specified and -d specified
    if [ ! -e "${MAPDATA_DIR}/${OSM_FILE}" ]; then
      echo "${error}Error: osm-file ${MAPDATA_DIR}/${OSM_FILE} does not exist.${reset}"; print_usage; exit 1
    fi
  fi
  # Only -f is specified so setup for a file load into the database.
fi

echo "${success}$0: Starting...${reset}"
echo "${success}----------------------------------------------------------------------${reset}"
cd ${UTILS_DIR}

# Create the default directory to hold OSM data if it is needed and it is not already there.
if [ "${MAPDATA_DIR}" == "" ]; then
  if [ ! -d "${MAPDATA_ROOT}/${DATA_DIR}/${OSM_DIR}" ]; then
    echo ""; echo ""
    echo "${info}$0: Creating ${MAPDATA_ROOT}/${DATA_DIR}/${OSM_DIR} directory...${reset}"
    echo "${info}----------------------------------------------------------------------${reset}"
    if [ ! -d "${MAPDATA_ROOT}" ]; then
      echo "${error}Error: Expected ${MAPDATA_ROOT} directory to exist.${reset}"; exit 1
    fi
    if [ ! -d "${MAPDATA_ROOT}/${DATA_DIR}" ]; then
      mkdir "${MAPDATA_ROOT}/${DATA_DIR}"
      if [ $? != 0 ]; then
        echo "${error}Error: Creation of directory failed. Command:${reset} mkdir ${MAPDATA_ROOT}/${DATA_DIR}"; exit 1
      fi
    fi
    if [ ! -d "${MAPDATA_ROOT}/${DATA_DIR}/${OSM_DIR}" ]; then
      mkdir "${MAPDATA_ROOT}/${DATA_DIR}/${OSM_DIR}"
      if [ $? != 0 ]; then
        echo "${error}Error: Creation of directory failed. Command:${reset} mkdir ${MAPDATA_ROOT}/${DATA_DIR}/${OSM_DIR}"; exit 1
      fi
    fi
  fi
  MAPDATA_DIR="${MAPDATA_ROOT}/${DATA_DIR}/${OSM_DIR}"
fi

# Download the OSM data if the user requested a download.
if [ "${DOWNLOAD_DATA}" == "true" ]; then
  # Save a backup of a file with the same name before we do the download.
  if [ -e "${MAPDATA_DIR}/${OSM_FILE}" ]; then
    echo ""; echo ""
    echo "${info}$0: Saving a copy of the existing file with a .prev extension.${reset}"
    echo "${info}----------------------------------------------------------------------${reset}"
    mv "${MAPDATA_DIR}/${OSM_FILE}" "${MAPDATA_DIR}/${OSM_FILE}.prev"
    if [ $? != 0 ]; then
      echo "${error}Error: Rename of file failed. Command:${reset} mv ${MAPDATA_DIR}/${OSM_FILE} ${MAPDATA_DIR}$/{OSM_FILE}.prev"; exit 1
    fi
  fi

  # Download the file.
  echo ""; echo ""
  echo "${info}$0: Downloading the file ${MAPDATA_DIR}${OSM_FILE} from ${DOWNLOAD_URL}...${reset}"
  echo "${info}----------------------------------------------------------------------${reset}"
  curl ${DOWNLOAD_URL} > "${MAPDATA_DIR}/${OSM_FILE}"
  if [ $? != 0 ]; then
    echo "${error}Error: Download of file failed. Command:${reset} curl ${DOWNLOAD_URL} > ${MAPDATA_DIR}/${OSM_FILE}"; exit 1
  fi
fi

# Load the OSM data into the database if requested by the user.
if [ "${LOAD_DB}" == "true" ]; then
  # Make sure that they have a default.style file in their OSM directory.
  if [ ! -e "${MAPDATA_DIR}/${STYLE}" ]; then
    echo ""; echo ""
    echo "${info}$0: Creating an initial ${MAPDATA_DIR}/${STYLE} file for you...${reset}"
    echo "${info}----------------------------------------------------------------------${reset}"
    cp ${UTILS_DIR}/${STYLE} "${MAPDATA_DIR}"
    if [ $? != 0 ]; then
      echo "${error}Error: Copy of ${STYLE} failed. Command:${reset} cp ${UTILS_DIR}/${STYLE} ${MAPDATA_DIR}"; exit 1
    fi
  fi

  # Load the data into Postgres.
  echo ""; echo ""
  echo "${info}$0: Loading the data into the Postgres database...${reset}"
  echo "${info}----------------------------------------------------------------------${reset}"
  osm2pgsql ${OSM2PGSQL_OPTIONS} --create --multi-geometry --database ${OSM_DB} --host ${DB_HOST} --port ${DB_PORT} --username ${DB_USERNAME} --style ${MAPDATA_DIR}/${STYLE} --hstore ${MAPDATA_DIR}/${OSM_FILE}
  if [ $? != 0 ]; then
    echo "${error}Error: Load of OSM data into database failed. Command:${reset} osm2pgsql ${OSM2PGSQL_OPTIONS} --create --multi-geometry --database ${OSM_DB} --host ${DB_HOST} --port ${DB_PORT} --username ${DB_USERNAME} --style ${MAPDATA_DIR}/${STYLE} --hstore ${MAPDATA_DIR}/${OSM_FILE}"; exit 1
  fi

  # Create indexes for better TileMill performance.
  echo ""; echo ""
  echo "${info}$0: Creating indexes in database for better TileMill performance...${reset}"
  echo "${info}----------------------------------------------------------------------${reset}"
  psql -d ${OSM_DB} -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USERNAME} -a -f ${INDEXES_SQL}
  if [ $? != 0 ]; then
    echo "${error}Error: Index creation failed. Command:${reset} psql -d ${OSM_DB} -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USERNAME} -a -f ${INDEXES_SQL}"; exit 1
  fi

  # Print out table counts.
  echo ""; echo ""
  echo "${info}$0: Printing out database table counts...${reset}"
  echo "${info}----------------------------------------------------------------------${reset}"
  psql -d ${OSM_DB} -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USERNAME} -a -f ${COUNTS_SQL}
  if [ $? != 0 ]; then
    echo "${error}Error: Table counts failed. Command:${reset} psql -d ${OSM_DB} -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USERNAME} -a -f ${COUNTS_SQL}"; exit 1
  fi
fi

# Record the end time and calculate the duration.
END=`date +%s`
DURATION=$((END-START))
sec=0
min=0
hour=0
if((DURATION>59));then
  ((sec=DURATION%60))
  ((DURATION=DURATION/60))
  if((DURATION>59));then
    ((min=DURATION%60))
    ((DURATION=DURATION/60))
    if((DURATION>23));then
      ((hour=DURATION%24))
    else
      ((hour=DURATION))
    fi
  else
    ((min=DURATION))
  fi
else
  ((sec=DURATION))
fi

echo ""; echo ""
echo "${success}----------------------------------------------------------------------${reset}"
echo "${success}$0: Complete! Processing time: ${hour}:${min}:$sec${reset}"
exit 0
