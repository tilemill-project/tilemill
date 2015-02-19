#!/usr/bin/env bash

cwd=$(pwd)

if [ -z "$1" ]; then
    gitsha="master"
else
    gitsha=$1
fi

if [ -z "$2" ]; then
    platform=$(uname -s | sed "y/ABCDEFGHIJKLMNOPQRSTUVWXYZ/abcdefghijklmnopqrstuvwxyz/")
else
    platform=$2
fi

if [ -z "$3" ]; then
    arch="x64"
else
    arch=$3
fi

s3dest="s3://mapbox/tilemill/build"
NODE_VERSION="0.10.33"
date_time=`date +%Y%m%d%H%M`
ATOM_VERSION="0.21.1"

atom_arch=$arch
arch_common_name=$arch
extra_install_args=""
if [ "$platform" == "win32" ]; then
    atom_arch="ia32"
    extra_install_args="--toolset=v140"
    if [[ $arch == "ia32" ]]; then
        arch_common_name="x86"
    fi
fi

set -e -u
set -o pipefail

if ! which git > /dev/null; then echo "git command not found"; exit 1; fi;
if ! which aws > /dev/null; then echo "aws command not found"; exit 1; fi;
if ! which npm > /dev/null; then echo "npm command not found"; exit 1; fi;
if ! which tar > /dev/null; then echo "tar command not found"; exit 1; fi;
if ! which curl > /dev/null; then echo "curl command not found"; exit 1; fi;
if ! which unzip > /dev/null; then echo "unzip command not found"; exit 1; fi;

build_dir="/tmp/tilemill-$platform-$arch_common_name-$gitsha"
shell_url="https://github.com/atom/atom-shell/releases/download/v$ATOM_VERSION/atom-shell-v$ATOM_VERSION-$platform-$atom_arch.zip"
shell_file="/tmp/atom-shell-v$ATOM_VERSION-$platform-$atom_arch.zip"

if [ "$platform" == "darwin" ]; then
    app_dir="/tmp/tilemill-$platform-$arch_common_name-$gitsha/Atom.app/Contents/Resources/app"
else
    app_dir="/tmp/tilemill-$platform-$arch_common_name-$gitsha/resources/app"
fi

echo "Building bundle in $build_dir"

if [ -d $build_dir ]; then
    echo "Build dir $build_dir already exists"
    exit 1
fi

echo "Downloading atom $shell_url"
curl -Lsfo $shell_file $shell_url
unzip -qq $shell_file -d $build_dir
rm $shell_file

echo "downloading tilemill"
git clone https://github.com/mapbox/tilemill.git $app_dir
cd $app_dir
git checkout $gitsha
rm -rf $app_dir/.git

echo "updating license"
# Update LICENSE and version files from atom default.
ver=$(node -e "var fs = require('fs'); console.log(JSON.parse(fs.readFileSync('$app_dir/package.json')).version);")
echo $ver > $build_dir/version
cp $app_dir/LICENSE.md $build_dir/LICENSE
mv $build_dir/version $build_dir/version.txt
mv $build_dir/LICENSE $build_dir/LICENSE.txt

echo "running npm install"
BUILD_PLATFORM=$platform TARGET_ARCH=$arch npm install --production \
--target_platform=$platform \
--target=$NODE_VERSION \
--target_arch=$arch \
--fallback-to-build=false $extra_install_args

rm \
    node_modules/backbone/raw/._destroy.psd \
    node_modules/backbone/test/._model.coffee \
    node_modules/backbone/test/._sync.js \
    node_modules/backbone/raw/._todos.psd \
    node_modules/backbone/._.DS_Store \
    node_modules/backbone/._LICENSE \
    node_modules/backbone/test/vendor/._json2.js \
    node_modules/backbone/raw/._background.psd \
    node_modules/backbone/._.gitignore \
    node_modules/backbone/._README \
    node_modules/backbone/examples/todos/._todos.css \
    node_modules/backbone/docs/._.DS_Store \
    node_modules/backbone/test/._events.js \
    node_modules/backbone/raw/._backbone.psd \
    node_modules/backbone/docs/images/._backbone.png \
    node_modules/backbone/raw/._arrows.psd

cd /tmp

# win32: installer using nsis
if [ $platform == "win32" ]; then
    if ! which makensis > /dev/null; then echo "makensis command not found"; exit 1; fi;
    if ! which signcode > /dev/null; then echo "signcode command not found"; exit 1; fi;
    if ! which expect > /dev/null; then echo "expect command not found"; exit 1; fi;
    if ! which windowsign > /dev/null; then echo "windowsign command not found"; exit 1; fi;

    # windows code signing
    aws s3 cp s3://mapbox/mapbox-studio/certs/authenticode.pvk authenticode.pvk
    aws s3 cp s3://mapbox/mapbox-studio/certs/authenticode.spc authenticode.spc

    echo "running windows signing on tilemill.exe"
    mv $build_dir/atom.exe $build_dir/tilemill.exe
    N='TileMill' I='https://www.mapbox.com/' P=$WINCERT_PASSWORD \
    SPC=authenticode.spc PVK=authenticode.pvk \
    windowsign $build_dir/tilemill.exe

    rm $build_dir/tilemill.exe.bak

    echo "downloading c++ lib vcredist_$arch_common_name.exe"
    curl -Lfo "$build_dir/resources/app/vendor/vcredist_$arch_common_name.exe" "https://mapbox.s3.amazonaws.com/node-cpp11/vcredist_$arch_common_name.exe"

    if [[ $arch == "x64" ]]; then
        # alternative package for windows: no-installer / can be run from usb drive
        7z a -r -mx9 ${build_dir}.7z $(basename $build_dir) > /dev/null
        echo "uploading ${build_dir}.7z"
        aws s3 cp --acl=public-read ${build_dir}.7z $s3dest/
        echo "Build at https://mapbox.s3.amazonaws.com/tilemill/build/$(basename ${build_dir}.7z)"
    fi

    echo "running makensis"
    makensis -V2 \
      -DTARGET_ARCH=${arch_common_name} \
      -DSOURCE_ROOT=${build_dir}/ \
      -DOUTPUT_FILE=${build_dir}.exe \
      -DVERSION=${ver} \
      ${build_dir}/resources/app/scripts/tilemill.nsi
    echo "cleaning up after makensis"
    rm -rf $build_dir

    echo "running windows signing on installer"
    N='TileMill' I='https://www.mapbox.com/' P=$WINCERT_PASSWORD \
    SPC=authenticode.spc PVK=authenticode.pvk \
    windowsign $build_dir.exe

    # remove cert
    rm -f authenticode.pvk
    rm -f authenticode.spc

    echo "uploading $build_dir.exe"
    aws s3 cp --acl=public-read $build_dir.exe $s3dest/
    echo "Build at https://mapbox.s3.amazonaws.com/tilemill/build/$(basename $build_dir.exe)"
    rm -f $build_dir.exe
# darwin: add app resources, zip up
elif [ $platform == "darwin" ]; then
    # Update Info.plist with correct version number.
    sed -i.bak s/VREPLACE/$ver/ $app_dir/scripts/assets/Info.plist

    rm $build_dir/Atom.app/Contents/Resources/atom.icns
    cp $app_dir/scripts/assets/tilemill.icns $build_dir/Atom.app/Contents/Resources/tilemill.icns
    cp $app_dir/scripts/assets/Info.plist $build_dir/Atom.app/Contents/Info.plist
    mv $build_dir/Atom.app "$build_dir/TileMill.app"

    # Test getting signing key.
    aws s3 cp "s3://mapbox/mapbox-studio/keys/Developer ID Certification Authority.cer" authority.cer
    aws s3 cp "s3://mapbox/mapbox-studio/keys/Developer ID Application: Mapbox, Inc. (GJZR2MEM28).cer" signing-key.cer
    aws s3 cp "s3://mapbox/mapbox-studio/keys/Mac Developer ID Application: Mapbox, Inc..p12" signing-key.p12
    security create-keychain -p travis signing.keychain \
        && echo "+ signing keychain created"
    security import authority.cer -k ~/Library/Keychains/signing.keychain -T /usr/bin/codesign \
        && echo "+ authority cer added to keychain"
    security import signing-key.cer -k ~/Library/Keychains/signing.keychain -T /usr/bin/codesign \
        && echo "+ signing cer added to keychain"
    security import signing-key.p12 -k ~/Library/Keychains/signing.keychain -P "" -T /usr/bin/codesign \
        && echo "+ signing key added to keychain"
    rm authority.cer
    rm signing-key.cer
    rm signing-key.p12

    # update time to try to avoid occaisonal codesign error of "timestamps differ by N seconds - check your system clock"
    sudo ntpdate -u time.apple.com

    # Sign .app file.
    codesign --keychain ~/Library/Keychains/signing.keychain --sign "Developer ID Application: Mapbox, Inc." --deep --verbose --force "$build_dir/TileMill.app"

    # Nuke signin keychain.
    security delete-keychain signing.keychain

    # Use ditto rather than zip to preserve code signing.
    ditto -c -k --sequesterRsrc --keepParent --zlibCompressionLevel 9 $(basename $build_dir) $build_dir.zip

    rm -rf $build_dir
    aws s3 cp --acl=public-read $build_dir.zip $s3dest/
    echo "Build at $s3dest/$(basename $build_dir.zip)"
    rm -f $build_dir.zip
# linux: zip up
else
    mv $build_dir/atom $build_dir/TileMill
    zip -qr -9 $build_dir.zip $(basename $build_dir)
    rm -rf $build_dir
    aws s3 cp --acl=public-read $build_dir.zip $s3dest/
    echo "Build at $s3dest/$(basename $build_dir.zip)"
    rm -f $build_dir.zip
fi

if [ "$ver" ==  "$(echo $gitsha | tr -d v)" && "$platform" == "darwin" ]; then
    datetime=`date`
    echo $ver > latest
    aws s3 cp --acl=public-read latest.json $s3dest/latest.json
    rm -f latest
    echo "Latest build version at $s3dest/latest.json"
fi

cd $cwd
