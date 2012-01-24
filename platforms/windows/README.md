# TileMill on Windows

This is a directory to store notes for building TileMill
on windows. It is not meant to be complete or for general use.

## Requires

 * Windows XP, Vista, or 7
 * Visual Studio C++ 2010 (Express works)
 * Mapnik master
 * vcredist_x86.exe from MS for 2010 C++ runtimes
 * Nsis Firewall plugin: http://wiz0u.free.fr/prog/nsisFirewall/

## TODO

 * Test NPM within installer
 * Update Mapnik builds notes (proj-trunk, ms 2010)
 * Trim installer by adding more excludes
 * Avoid copying gdal/proj data
 * Test sqlite/postgis
 * Statically link libzip to node-zipfile
 * Avoid need for `vcredist_x86.exe`
 * Upgrade node to 0.6.7
 * Test on Windows Vista

## Setup

1) Compile Mapnik and dependencies as per:

    https://github.com/mapnik/mapnik-packaging/tree/master/windows

2) Compile node v0.6.x.

3) Download from github all node C++ modules required by TileMill. Build
then by running the `vcbuild.bat` script inside. These include:

 * node-sqlite (windows branch)
 * node-mapnik (master or latest tag)
 * node-srs (master or latest tag)
 * node-zipfile (master or latest tag)
 * contextify (https://github.com/springmeyer/contextify)

4) Then we can install TileMill

We have to force things to work with node-v6 and to work around
the C++ modules build failures during npm install.

```
git clone https://github.com/mapbox/tilemill.git
cd tilemill
git checkout node-v6
# ideally always using the latest latest npm
npm install -g npm@alpha
npm install jshint -g

# we force so that express is installed even though it thinks
# it will not work with node v0.6 (but it does)
npm install express@2.4.7 --force

# install a jsdom version that works with node-v0.6 before we install bones
# we force here to skip past contextify failure
npm install jsdom@0.2.10 --force --no-rollback
rd /q /s node_modules\jsdom\node_modules\contextify

# force here as the most can go wrong with bones deps and its nice
# to see blowout right now rather than during the full install
npm install bones@1.3.22 --force --no-rollback
rd /q /s node_modules\bones\node_modules\jsdom

# remainder of install, forcing to avoid c++ module failures
npm install --force --no-rollback

# cleanup C++ modules folders and jsdom
rd /q /s node_modules\bones\node_modules\jquery\node_modules\jsdom
rd /q /s node_modules\sqlite3
rd /q /s node_modules\mapnik
rd /q /s node_modules\millstone\node_modules\srs
rd /q /s node_modules\millstone\node_modules\zipfile
rd /q /s node_modules\tilelive-mapnik\node_modules\eio
```

5) Localize C++ modules


```
cd platforms\windows
package
```

6) Test running TileMill

```
platforms\windows\run-tilemill
```

7) Package

Remove road-trip from examples folder until https://github.com/mapbox/tilemill/issues/1212 is decided upon.

Manually generate the `VERSION` file in the root until https://github.com/mapbox/tilemill/issues/1213 is solved.

Download the from 2010 C++ "redistributable" runtime from:

    http://www.microsoft.com/download/en/details.aspx?id=5555

And place it in the `platforms/windows` directory.

Download the nsisFirewall and place it in the `platforms/windows/installer` directory.

Install nsis and run the installer script in `platforms\windows\installer`.
