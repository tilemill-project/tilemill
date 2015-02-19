#!/usr/bin/env bash

platform=$BUILD_PLATFORM

if [ -z "$platform" ]; then
    platform=$(uname -s | sed "y/ABCDEFGHIJKLMNOPQRSTUVWXYZ/abcdefghijklmnopqrstuvwxyz/")
fi

if [ "$platform" == "win32" ]; then
    export INSTALL_NODE_URL=https://mapbox.s3.amazonaws.com/node-cpp11
fi

if [ -z $NODE_VERSION ]; then
    echo "NOTICE: NODE_VERSION environment variable not defined, defaulting to 0.10.33"
    NODE_VERSION=0.10.33
fi

if [ -z $TARGET_ARCH ]; then
    echo "NOTICE: TARGET_ARCH environment variable not defined, defaulting to x64"
    TARGET_ARCH=x64
fi

set -e -u
set -o pipefail

cwd=$(pwd)
mkdir -p $(dirname $0)/../vendor
cd $(dirname $0)/../vendor
curl https://s3.amazonaws.com/mapbox/apps/install-node/v0.2.0/run |  NV=$NODE_VERSION NP=$platform-$TARGET_ARCH OD=$(pwd) BO=true sh

cd $cwd
