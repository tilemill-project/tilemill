# Packaging TileMill

This `platforms` directory is intended to store notes on how
a TileMill developer might go about packaging for a release.

They are a work in progress. Please ask questions to fill in holes.

## Overall workflow

1. Test, do dev builds, make sure all dependencies are tagged and stable versions are good

1. Sync the `_posts/assets/manual` and `_posts/docs/reference` files from `gh-pages` to `master` (See the `Syncing Manual` section of main readme for details)

1. Increment the version in `package.json`, `platforms/windows/installer/nsis_script.nsi`, and `platforms/ubuntu/debian/changelog`

1. Tag tilemill:

```
VERSION="0.10.1"
git tag v$VERSION -m "tagging v$VERSION"
```

1. OSX builds: use mini build machine, simply tweak the [build script](https://github.com/mapbox/tilemill-builder-osx) to checkout a tilemill tag (instead of master) and run the tweaked script manually. Download .zip to local machine, upload to github downloads page, then go back into local source tilemill checkout, run `make sparkle` and then use that to update the `_posts/0100-01-01-CHANGELOG.md`.

1. Windows - only Dane has a working VM at this point. Steps to setup VM are hard, but based on [mapnik-packaging repo instructions](https://github.com/mapnik/mapnik-packaging) and visual studio 2010. Tested only on Windows 7 so far but any Windows version should work. Build mapnik and deps, then build tilemill by running the scripts in `platforms/windows` first `build.bat` then `package.bat` then `run-tilemill.bat`. Confirm things work, then go package the installer by running the nsis script in `platforms\windows\installer` after modifying the version # in the script. Then upload to github downloads.

1. Linux - we use launchpad - follow the readme in `platforms/ubuntu/` First push to `ppa:developmentseed/mapbox-dev` then test on a headless ec2 and on a desktop version (can do in a VirtualBox VM), then copy to the `mapbox` PPA. Prepare to experience and troubleshoot launchpad build failures over several days. When done, copy one or two binaries at a time to avoid timeouts - will take 10-20 minutes of clicking.

1. Publish TileMill to npm (which is what windows and linux use to indicated update availability)

1. Write blog post, update download links, changelog and upgrade notes like #1702

1. Ensure key plugins are republished to support the new version
