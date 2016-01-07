#!/bin/bash

pkexec /bin/bash -c "apt-get install --yes python-software-properties &&
    apt-add-repository --yes ppa:developmentseed/mapbox &&
    apt-get update --yes &&
    apt-get install --yes tilemill"

read -sp "Press [ENTER] to quit."
