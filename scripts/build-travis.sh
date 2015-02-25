#!/usr/bin/env bash

set -e -u

PLATFORM=$(uname -s | sed "y/ABCDEFGHIJKLMNOPQRSTUVWXYZ/abcdefghijklmnopqrstuvwxyz/")
COMMIT_MESSAGE=$(git show -s --format=%B $1 | tr -d '\n')
GITSHA=$(echo "$COMMIT_MESSAGE" | grep -oE '\[publish [a-z0-9\.\-]+\]' | grep -oE '[a-z0-9\.\-]+' | tail -n1)

if [ $PLATFORM == "linux" ] && [ -n "$GITSHA" ]; then
    echo "Publishing $GITSHA"
    sudo apt-get update
    sudo apt-get install -qqy curl unzip nsis python-pip mono-devel expect p7zip-full
    sudo pip install -q awscli
    sudo apt-get install wine
    sudo curl -Lsf https://github.com/mapbox/windowsign/archive/v0.0.1.tar.gz | \
    sudo tar --strip 1 -xzf - --directory=/usr/local/bin "windowsign-0.0.1/windowsign"
    ./scripts/build-tilemill.sh "$GITSHA" linux
    ./scripts/build-tilemill.sh "$GITSHA" win32 x64
    ./scripts/build-tilemill.sh "$GITSHA" win32 ia32
elif [ $PLATFORM == "darwin" ] && [ -n "$GITSHA" ]; then
    echo "Publishing $GITSHA"
    brew install python
    pip install -q awscli
    ./scripts/build-tilemill.sh "$GITSHA" darwin
fi
