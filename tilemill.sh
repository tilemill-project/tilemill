#!/bin/sh

# Source bash profile just in case they have not done that between installing nvm/npm and this.
source ${HOME}/.bash_profile

info=`tput setaf 6`;error=`tput setaf 1`;success=`tput setaf 2`;reset=`tput sgr0` # Colors for text
echo "${info}This script will run the TileMill server. You will need to leave this server running while you are using TileMill. When you are finished using TileMill you can shutdown the server by holding the control key while hitting the c key. Or, you can close the Terminal window.${reset}"
echo "${info}----------------------------------------------------------------------${reset}"
echo ""

# Run the client. This script will launch the browser once the server has successfully started.
./utils/runclient.sh &

# Start the server.
npm start