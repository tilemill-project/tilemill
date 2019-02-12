#!/bin/sh

info=`tput setaf 6`;error=`tput setaf 1`;success=`tput setaf 2`;reset=`tput sgr0` # Colors for text
echo "${info}This script will run the TileMill server. You will need to leave this server running while you are using TileMill. When you are finished using TileMill you can shutdown the server by holding the control key while hitting the c key. Or, you can close the Terminal window.${reset}"
echo ""
echo "${info}${reset}"
}
./runclient.sh &
cd ..
npm start