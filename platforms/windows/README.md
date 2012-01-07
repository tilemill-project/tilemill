# TileMill on Windows

This is a directory to store notes for building TileMill
on windows. It is not meant to be complete or for general use.

## Requires

 * Windows XP, Vista, or 7
 * Visual Studio C++ 2010 (Express works)
 * Mapnik master

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
del node_modules\jsdom\node_modules\contextify

# force here as the most can go wrong with bones deps and its nice
# to see blowout right now rather than during the full install
npm install bones@1.3.22 --force --no-rollback
del node_modules\bones\node_modules\jsdom

# remainder of install, forcing to avoid c++ module failures
npm install --force --no-rollback

# cleanup C++ modules folders and jsdom
del node_modules\bones\node_modules\jquery\node_modules\jsdom
del node_modules\sqlite3
del node_modules\mapnik
del node_modules\millstone\node_modules\srs
del node_modules\millstone\node_modules\zipfile
del node_modules\tilelive-mapnik\node_modules\eio
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

Install nsis and run the installer script in `platforms\windows\installer`.

