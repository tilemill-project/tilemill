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
NVM_VER="v0.34.0"                # Version of NVM that will be installed if no version is present.
NODE_VER="lts/carbon"            # Version of Node that will be installed.
VERSION=""                       # Variable used to hold the desired version.
# Set the versions that will be supported by this script (anything >= v1.0.0).
for v in $(git tag -l | grep "^v" | grep -v "^v0")
do
  VERSIONS+=( "$v" )
done
#VERSIONS+=( "v1.0.1-dev" ) # Version to use in testing.

print_intro () {
  echo "This script will install or update TileMill. It is assumed that TileMill is already cloned using git and you are running this script from the tilemill/utils directory. This script only works for versions of TileMill > v1.0.0. If TileMill has not been installed before, this script will install Node and install the requested version of TileMill. If TileMill has been installed, this script will update Node and update TileMill to the requested version."
}

print_usage () {
  echo "Usage:"
  echo "    $0 version          Install the specified version of TileMill."
  echo "    $0 -h               Print help."
  echo "    $0 -v               List valid versions."
  echo "    $0 -u               Uninstall."
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

# Touch the appropriate profile.
touch_profile () {
  if [ ${OS} == "osx" ]; then
    touch ${HOME}/.bash_profile
  else
    touch ${HOME}/.bashrc
  fi
}

# Source the appropriate profile.
source_profile () {
  if [ ${OS} == "osx" ]; then
    source ${HOME}/.bash_profile
  else
    source ${HOME}/.bashrc
  fi
}

# Uninstall a previous installation that was done using this script.
uninstall () {
  echo ""
  echo "${warning}This function is only meant to uninstall components that were previously installed by this script. This will include uninstalling nodejs/npm, nvm, and resetting tilemill code to the default/master version. If you do not want any of these components uninstalled from your system, you should abort.${reset}"
  echo "Continue with uninstall?[y/n]:";
  read answer
  if [ ${answer} != "y" ]; then
      echo "${error}Aborting.${reset}"; exit 1
  fi
      
  # Deactivate and uninstall node.
  echo ""; echo ""
  echo "${info}$0: Uninstalling Nodejs and npm...${reset}"
  echo "${info}----------------------------------------------------------------------${reset}"
  source ${HOME}/.nvm/nvm.sh
  nvm deactivate
  nvm uninstall ${NVM_VER}
  nvm unload
  unset NVM_DIR
  
  # Remove the nvm and npm cache/user files.
  echo ""; echo ""
  echo "${info}$0: Removing nvm and npm user/cache files...${reset}"
  echo "${info}----------------------------------------------------------------------${reset}"
  rm -rf ${HOME}/.nvm ${HOME}/.npm

  # Update the appropriate profile to remove nvm.
  echo ""; echo ""
  echo "${info}$0: Removing nvm references from profile files...${reset}"
  echo "${info}----------------------------------------------------------------------${reset}"
  if [ ${OS} == "osx" ]; then
    grep -iv nvm ${HOME}/.bash_profile > ${HOME}/.bash_profile.2
    mv ${HOME}/.bash_profile.2 ${HOME}/.bash_profile
  else
    grep -iv nvm ${HOME}/.bashrc > ${HOME}/.bashrc.2
    mv ${HOME}/.bashrc.2 ${HOME}/.bashrc
  fi

  # Resetting tilemill download to default/master code.
  echo ""; echo ""
  echo "${info}$0: Resetting tilemill download to default/master code...${reset}"
  echo "${info}----------------------------------------------------------------------${reset}"
  git checkout master

  echo ""
  echo "${info}Uninstall complete!${reset}";
}

# Ensure that options and arguments enterered are valid.
if [ "$1" == "--help" ]; then
  print_intro; print_usage; exit 1
fi
while getopts ":hvu" opt; do
  case ${opt} in
    h ) print_intro; print_usage; exit 1;;
    v ) print_versions; exit 1;;
    u ) uninstall; exit 0;;
    \? ) echo "${error}Invalid option.${reset}"; print_usage; exit 1;;
  esac
done
if [ "$1" == "" ]; then
  echo "${error}version required.${reset}"; print_usage; exit 1
fi
if [ "$2" != "" ]; then
  echo "${error}Invalid argument $2.${reset}"; print_usage; exit 1
fi
validate_version "$1"
if [ $? != 0 ]; then
  echo "${error}Invalid version $1.${reset}"; print_usage; exit 1
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

  # Installing NVM pre-requisites if in Linux OS.
  if [ ${OS} == "linux" ]; then
    # Ensure that apt-get is up to date.
    sudo apt-get update
    if [ $? != 0 ]; then
      echo "${error}Update of apt failed. Command:${reset} sudo apt-get update"; exit 1
    fi
    # Install packages that may be needed by nvm.
    sudo apt-get --assume-yes install build-essential libssl-dev
    if [ $? != 0 ]; then
      echo "${error}Installation of pre-requisite packages failed. Command:${reset} sudo apt-get install build-essential libssl-dev"; exit 1
    fi
  fi

  # Installing NVM.
  touch_profile
  unset NVM_DIR
  # From instructions found at https://github.com/creationix/nvm
  curl -o- https://raw.githubusercontent.com/creationix/nvm/${NVM_VER}/install.sh | bash
  if [ $? != 0 ]; then
    echo "${error}Installation of Node Version Manager failed. Command:${reset} curl -o- https://raw.githubusercontent.com/creationix/nvm/${NVM_VER}/install.sh | bash"; exit 1
  fi
  source_profile

  # Checking to see if nvm is now there after the install.
  if [ ! -e ${HOME}/.nvm/nvm.sh ]; then
    echo "${error}Installation of Node Version Manager failed.${reset}"; exit 1
  fi
fi
source ${HOME}/.nvm/nvm.sh

# Install Node.
echo ""; echo ""
echo "${info}$0: Installing/updating Node...${reset}"
echo "${info}----------------------------------------------------------------------${reset}"
nvm install ${NODE_VER}
if [ $? != 0 ]; then
  echo "${error}Installation of Node failed. Command:${reset} nvm install ${NODE_VER}"; exit 1
fi
nvm install-latest-npm
if [ $? != 0 ]; then
  echo "${error}Updating npm to the latest version failed. Command:${reset} nvm install-latest-npm"; exit 1
fi
source_profile

# Update TileMill source to the correct version.
echo ""; echo ""
echo "${info}$0: Updating TileMill source to the correct version...${reset}"
echo "${info}----------------------------------------------------------------------${reset}"
git fetch --tags
if [ $? != 0 ]; then
  echo "${error}Fetch of tags failed. Command:${reset} git fetch --tags"; exit 1
fi
git fetch
if [ $? != 0 ]; then
  echo "${error}Fetch of tags failed. Command:${reset} git fetch"; exit 1
fi
git checkout $VERSION
if [ $? != 0 ]; then
  echo "${error}Checkout of version $VERSION failed. Command:${reset} git checkout $VERSION"; exit 1
fi

# Install TileMill from source.
echo ""; echo ""
echo "${info}$0: Installing TileMill from source...${reset}"
echo "${info}----------------------------------------------------------------------${reset}"
npm clean-install
if [ $? != 0 ]; then
  echo "${error}Install of TileMill failed. Command:${reset} npm clean-install"; exit 1
fi

echo ""; echo ""
echo "${success}----------------------------------------------------------------------${reset}"
echo "${success}$0: Complete!${reset}"
exit 0
