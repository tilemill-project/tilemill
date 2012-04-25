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

 * Update Mapnik builds notes (proj-trunk, ms 2010)
 * Trim installer by adding more excludes

## Setup

1) Compile Mapnik and dependencies as per:

    https://github.com/mapnik/mapnik-packaging/tree/master/windows

2) Compile node v0.6.x.

3) Download from github all node C++ modules required by TileMill. Build
them by running the `vcbuild.bat` script inside. These include:

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
npm install jshint -g
npm install --force --no-rollback
rd /q /s node_modules\bones\node_modules\jquery\node_modules\jsdom\node_modules\contextify
rd /q /s node_modules\sqlite3
rd /q /s node_modules\mapnik
rd /q /s node_modules\millstone\node_modules\srs
rd /q /s node_modules\millstone\node_modules\zipfile
rd /q /s node_modules\tilelive-mapnik\node_modules\eio
```

5) Localize C++ modules

Run this command:

```
platforms\windows\package
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
