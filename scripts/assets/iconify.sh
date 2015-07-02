#!/usr/bin/env bash
# Builds tilemill.icns and tilemill.ico

set -e -u
set -o pipefail

if ! which inkscape > /dev/null; then echo "inkscape not found"; exit 1; fi
if ! which png2icns > /dev/null; then echo "png2icns not found"; exit 1; fi
if ! which convert > /dev/null; then echo "convert not found"; exit 1; fi

basedir=$(dirname $0)

inkscape \
    --export-dpi=90 \
    --export-png=$basedir/tilemill-16x16.png \
    $basedir/tilemill-16x16.svg > /dev/null
inkscape \
    --export-dpi=90 \
    --export-png=$basedir/tilemill-32x32.png \
    $basedir/tilemill-32x32.svg > /dev/null
inkscape \
    --export-dpi=180 \
    --export-png=$basedir/tilemill-64x64.png \
    $basedir/tilemill-32x32.svg > /dev/null
inkscape \
    --export-dpi=360 \
    --export-png=$basedir/tilemill-128x128.png \
    $basedir/tilemill-32x32.svg > /dev/null
inkscape \
    --export-dpi=720 \
    --export-png=$basedir/tilemill-256x256.png \
    $basedir/tilemill-32x32.svg > /dev/null
inkscape \
    --export-dpi=1440 \
    --export-png=$basedir/tilemill-512x512.png \
    $basedir/tilemill-32x32.svg > /dev/null

png2icns $basedir/tilemill.icns \
    $basedir/tilemill-16x16.png \
    $basedir/tilemill-32x32.png \
    $basedir/tilemill-128x128.png \
    $basedir/tilemill-512x512.png

convert $basedir/tilemill-256x256.png  \
      \( $basedir/tilemill-16x16.png \) \
      \( $basedir/tilemill-32x32.png \) \
      \( $basedir/tilemill-64x64.png \) \
      \( $basedir/tilemill-128x128.png \) \
      \( -clone 0 \) \
      -delete 0 $basedir/tilemill.ico

rm $basedir/*.png
