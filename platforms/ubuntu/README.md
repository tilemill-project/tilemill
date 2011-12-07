## Packaging script

There is a packaging script located in this directory (./platforms/ubuntu)
called `package.sh` which may be used to create and upload a new package
to launchpad.net.

### Requirements

Install some packages:

    apt-get install debhelper devscripts dput git-core cdbs pgpgpg

For more info on these requirements see: https://wiki.ubuntu.com/PackagingGuide/Complete#Packaging_Tools

Then create your PGP key through the GUI tool "Passwords and Keys". Make sure to create entropy as the key
is created by moving your mouse around or typing.

For more info on creating your key see: https://help.launchpad.net/YourAccount/ImportingYourPGPKey

## Resources on packaging

* https://wiki.ubuntu.com/PackagingGuide/Complete
* http://www.debian.org/doc/manuals/maint-guide/

### Usage

* Update debian/changelog and add a new changelog message.  Respect the
  version convention.  Packaging changes should increment the package
  version, while upstream source changes should increment the minor/
  major version.  For example package-0.4.0-0ubuntu1 goes to
  package-0.4.0-0ubuntu2 for packaging changes. For upstream source
  changes, the minor or major version should change, like
  package-0.4.1-0ubuntu1. The packaging version always starts at 1.
* Run `./package.sh` with no arguments, which will build and upload the
  package to the "mapbox-dev" PPA.
* Use the -p (production) flag, like `./package.sh -p` to push a build
  up to the main "mapbox" PPA.

## Copying node and mapnik packages

To ensure installation of proper dependencies, we copy dependant packages to
our own PPA. To copy packages, follow the steps below for each of the following
pages:

- [chris-lea/node.js](https://launchpad.net/~chris-lea/+archive/node.js/+copy-packages)
- [mapnik/nightly-trunk](https://launchpad.net/~mapnik/+archive/nightly-trunk)

1. Select the packages you want to copy. Confirm the proper package version
   and include each supported series.
2. Select the **Destination PPA**. Use MapBox Dev for testing packages. You'll
   only copy to MapBox when you are ready to publish, and you'll generally want
   to copy exiting packages from MapBox Dev after testing.
3. The **Destination series** should be set to **The same series**.
4. Select **Copy existing binaries**.
5. Click **Copy Packages** and wait for the packages to be copied.

## Testing builds with Pbuilder

If your package depends on other PPA's, as does TileMill and TileStream (nodejs,
for example), you can build a pbuilder chroot which will include those PPA's. 
For example, first use [this script in your ~/.pbuilderrc](https://wiki.ubuntu.com/PbuilderHowto#Multiple_pbuilders), then, when you create your pbuilder environment, run the command like:

```
sudo DIST=maverick pbuilder create --override-config --othermirror="\deb
http://ppa.launchpad.net/chris-lea/node.js/ubuntu maverick main |
deb http://ppa.launchpad.net/mapnik/nightly-trunk/ubuntu maverick main"
```

which will make sure the required PPA's are available within your pbuilder chroot when
running test builds.  To use this pbuilder, provided you've put the above linked
script into ~/.pbuilderrc, just run:

    sudo DIST=maverick pbuilder build tilemill_0.4.1-0.dsc

