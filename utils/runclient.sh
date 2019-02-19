#!/bin/sh

# Check if TileMill port is open...
host="127.0.0.1"
port="20009"
port_status="closed"
timeout=15
counter=0

while [ $port_status != "open" ]
do
 sleep 1
 (( counter += 1 ))
 #echo "Checking if ${host}:${port} is open..."
 port_status=`(echo >/dev/tcp/$host/$port) &>/dev/null && echo "open" || echo "close"`
 if [ $counter == $timeout ]; then
   echo "TileMill is not available at ${host}:${port}";exit 1;
 fi
done
echo "Opening TileMill session in browser..."
open "http://${host}:${port}"
exit 0
