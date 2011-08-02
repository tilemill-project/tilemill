## Resources

* https://wiki.ubuntu.com/PackagingGuide/Complete
* http://www.debian.org/doc/manuals/maint-guide/

## Making a new release package

1. Make sure you have a clean copy of the new release. Run `npm install` to
  make sure your tilemill is fully built.
2. Add an entry to `debian/changelog` for maverick.

    tilemill (0.4.0-0) maverick; urgency=medium
      * tilemill 0.4.0.
     -- Young Hahn <yfhahn@gmail.com>  Mon, 1 Aug 2011 16:27:44 -0400

3. Run `./package.sh`. This will package the new release and push the changes
  to the PPA for maverick.
4. Repeat step 2 for natty -- add a distinct changelog entry and increment the
  debian revision number.

    tilemill (0.4.0-1) natty; urgency=medium
      * tilemill 0.4.0.
     -- Young Hahn <yfhahn@gmail.com>  Mon, 1 Aug 2011 16:27:44 -0400

5. Run `./package.sh`. This will package the new release and push the changes
  to the PPA for natty.

## Pbuilder

If your package depends on other PPA's, as does TileMill and TileStream (nodejs,
for example), you can build a pbuilder chroot which will include those PPA's. 
For example, first use [this script in your ~/.pbuilderrc](https://wiki.ubuntu.com/PbuilderHowto#Multiple_pbuilders), then, when you create your pbuilder environment,
run the command like

    sudo DIST=maverick pbuilder create --override-config --othermirror="\deb
http://ppa.launchpad.net/chris-lea/node.js/ubuntu maverick main |
deb http://ppa.launchpad.net/mapnik/nightly-trunk/ubuntu maverick main"

which will make sure the required PPA's are available within your pbuilder chroot when
running test builds.  To use this pbuilder, provided you've put the above linked
script into ~/.pbuilderrc, just run `sudo DIST=maverick pbuilder build
tilemill_0.4.1-0.dsc`

