## Resources

* https://wiki.ubuntu.com/PackagingGuide/Complete
* http://www.debian.org/doc/manuals/maint-guide/

## Basics

Following are quick basics, using TileMill as an example

* `mkdir tilemill` 
* check out tilemill from git, build it, rename the dir to tilemill-0.4.1 
  (assuming that's the version) 
* remove .git and .gitignore dir/file in tilemill working copy 
* `tar cvzf tilemill-0.4.1.tar.gz` 
* cp tilemill-0.4.1.tar.gz tilemill_0.4.1.orig.tar.gz 
* Move both of these tarballs into the `tilemill` directory, if not already in it.  
* From inside tilemill-0.4.1 do `git clone https://github.com/mapbox/tilemill-pkg 
  debian` 
* cd into debian directory, run `debuild -inode_modules\|.git\|.png\|.ttf -S -sa`
  the -i flag says which types of files or directories to not include in the
  package diff.  You must not include binaries.  
* Then, from base of directory `tilemill` directory, you can use pbuilder to test 
  the build.  See notes below about pbuilder.  
* From within `tilemill` directory, run:
  `dput ppa:developmentseed/mapbox tilemill_0.4.1-0_source.changes` after which 
  the package is uploaded to launchpad and built.  
* The .changes file created depends on the latest version specified in the 
  debian/changelog file.  
* Before running the `dput` command you can test your build with pbuilder.  See 
  the pbuilder section on this page.

## Pbuilder

If your package depends on other PPA's, as does TileMill and TileStream (nodejs,
mapnik nightly trunk, for example), you can build a pbuilder chroot which will
include those PPA's.  For example, first use [this script in your
~/.pbuilderrc](https://wiki.ubuntu.com/PbuilderHowto#Multiple_pbuilders), then,
when you create your pbuilder environment, run the command like `sudo
DIST=maverick pbuilder create --override-config --othermirror="deb
http://ppa.launchpad.net/chris-lea/node.js/ubuntu maverick main" --othermirror
"deb http://ppa.launchpad.net/mapnik/nightly-trunk/ubuntu maverick main"` which
will make sure the required PPA's are available within your pbuilder chroot when
running test builds.  To use this pbuilder, provided you've put the above linked
script into ~/.pbuilderrc, just run `sudo DIST=maverick pbuilder build
tilemill_0.4.1-0.dsc`

