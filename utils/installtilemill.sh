#!/bin/sh

# Initialize global variables.
NVM_VER="v0.34.0"                # Version of NVM that will be installed if no version is present.
NODE_VER="lts/carbon"            # Version of Node that will be installed.
VERSION=""                       # Variable used to hold the desired version.
info=`tput setaf 6`;error=`tput setaf 1`;success=`tput setaf 2`;reset=`tput sgr0` # Colors for text
# Set the versions that will be supported by this script (anything >= v1.0.0).
for v in $(git tag -l | grep "^v" | grep -v "^v0")
do
  VERSIONS+=( "$v" )
done
# The following vesions are added so that we can do testing.
VERSIONS+=( "v1.0.0-dev" )

print_intro () {
  echo "This script will install or update TileMill. It is assumed that TileMill is already cloned using git and you are running this script from the tilemill/utils directory. This script only works for versions of TileMill > v1.0.0. If TileMill has not been installed before, this script will install Node and install the requested version of TileMill. If TileMill has been installed, this script will update Node and update TileMill to the requested version."
}

print_usage () {
  echo "Usage:"
  echo "    $0 version          Install the specified version of TileMill."
  echo "    $0 -h               Print help."
  echo "    $0 -v               List valid versions."
}

# Print out a list of the valid TileMill versions that can be installed by this script.
print_versions () {
  echo "Valid TileMill versions:"
  for v in "${VERSIONS[@]}"
  do
    echo "    $v"
  done
}

# For a passed in version, make sure that it is valid.
validate_version () {
  ver="$1"
  for v in "${VERSIONS[@]}"
  do
    if [ "$v" == "$ver" ]; then
      return 0
    fi
  done
  return 1    # version not found in VERSION array.
}

# Ensure that options and arguments enterered are valid.
if [ "$1" == "--help" ]; then
  print_intro; print_usage; exit 1
fi
while getopts ":hv" opt; do
  case ${opt} in
    h ) print_intro; print_usage; exit 1;;
    v ) print_versions; exit 1;;
    \? ) echo "${error}Error: Invalid option.${reset}"; print_usage; exit 1;;
  esac
done
if [ "$1" == "" ]; then
  echo "${error}Error: version required.${reset}"; print_usage; exit 1
fi
if [ "$2" != "" ]; then
  echo "${error}Error: Invalid argument $2.${reset}"; print_usage; exit 1
fi
validate_version "$1"
if [ $? != 0 ]; then
  echo "${error}Error: Invalid version $1.${reset}"; print_usage; exit 1
fi
VERSION="$1"

echo "${success}$0: Starting...${reset}"
echo "${success}----------------------------------------------------------------------${reset}"
cd ..

# Install Node Version Manager if it is not already there.
echo ""; echo ""
echo "${info}$0: Installing Node Version Manager if not already there...${reset}"
echo "${info}----------------------------------------------------------------------${reset}"
if [ ! -e ${HOME}/.nvm/nvm.sh ]; then
  # Installing NVM.
  touch ~/.bash_profile
  # From instructions found at https://github.com/creationix/nvm
  curl -o- https://raw.githubusercontent.com/creationix/nvm/${NVM_VER}/install.sh | bash
  if [ $? != 0 ]; then
    echo "${error}Error: Installation of Node Version Manager failed. Command:${reset} curl -o- https://raw.githubusercontent.com/creationix/nvm/${NVM_VER}/install.sh | bash"; exit 1
  fi
  source ~/.bash_profile

  # Checking to see if nvm is now there after the install.
  if [ ! -e ${HOME}/.nvm/nvm.sh ]; then
    echo "${error}Error: Installation of Node Version Manager failed.${reset}"; exit 1
  fi
fi
source ${HOME}/.nvm/nvm.sh

# Install Node.
echo ""; echo ""
echo "${info}$0: Installing/updating Node...${reset}"
echo "${info}----------------------------------------------------------------------${reset}"
nvm install ${NODE_VER}
if [ $? != 0 ]; then
  echo "${error}Error: Installation of Node failed. Command:${reset} nvm install ${NODE_VER}"; exit 1
fi
nvm install-latest-npm
if [ $? != 0 ]; then
  echo "${error}Error: Updating npm to the latest version failed. Command:${reset} nvm install-latest-npm"; exit 1
fi
source ~/.bash_profile

# Update TileMill source to the correct version.
echo ""; echo ""
echo "${info}$0: Updating TileMill source to the correct version...${reset}"
echo "${info}----------------------------------------------------------------------${reset}"
git fetch --tags
if [ $? != 0 ]; then
  echo "${error}Error: Fetch of tags failed. Command:${reset} git fetch --tags"; exit 1
fi
git fetch
if [ $? != 0 ]; then
  echo "${error}Error: Fetch of tags failed. Command:${reset} git fetch"; exit 1
fi
git checkout $VERSION
if [ $? != 0 ]; then
  echo "${error}Error: Checkout of version $VERSION failed. Command:${reset} git checkout $VERSION"; exit 1
fi

# Install TileMill from source.
echo ""; echo ""
echo "${info}$0: Installing TileMill from source...${reset}"
echo "${info}----------------------------------------------------------------------${reset}"
npm clean-install
if [ $? != 0 ]; then
  echo "${error}Error: Install of TileMill failed. Command:${reset} npm clean-install"; exit 1
fi

echo ""; echo ""
echo "${success}----------------------------------------------------------------------${reset}"
echo "${success}$0: Complete!${reset}"
exit 0