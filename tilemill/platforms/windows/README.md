# TileMill on Windows

This is a directory to store notes for building TileMill
on windows. It is not meant to be complete or for general use.

## Requires

 * Windows XP, Vista, or 7
 * Nsis Firewall plugin: http://wiz0u.free.fr/prog/nsisFirewall/
 * chocolatey for installing wget
 * wget for downloading remote files
 * bsdtar for unpacking topcube client

## TODO

 * Trim installer by adding more excludes

## Setup

1) Install Node.js x64 0.10.33 from http://nodejs.org/download/

2) Install custom node.exe locally

Download Node.exe from:

    https://mapbox.s3.amazonaws.com/node-cpp11/v0.10.33/x64/node.exe

And place it in the root directory. Use this to run TileMill instead of the globally installed version.

The globally installed version is only used for npm.

3) Install vcredist

Download the C++ "redistributable" runtime from:

    https://mapbox.s3.amazonaws.com/node-cpp11/vcredist_x64.exe

And place it in the `platforms/windows` directory.

4) Install TileMill

```
git clone https://github.com/mapbox/tilemill.git
cd tilemill
platforms\windows\build.bat
```

5) Test running TileMill

```
.\node.exe .\index.js
```

6) Package

Run the installer