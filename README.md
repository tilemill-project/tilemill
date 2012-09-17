TileMill is a modern map design studio powered by open source technology.
Installation instructions, development docs and other information are available
on the [TileMill website](http://mapbox.com/tilemill).

- [Install packages](http://mapbox.com/tilemill/docs/install/)
- [Build from source](http://mapbox.com/tilemill/docs/source/)


# Running tests

Install mocha and run the tests

    npm install mocha
    npm test


Note: the tests require a running postgres server and a postgis enabled
database called `template_postgis`.

If you do not have a `template_postgis` create one like:

    POSTGIS_VERSION="1.5" # you may need to change this
    POSTGIS_PATH=`pg_config --sharedir`/contrib/postgis-$POSTGIS_VERSION
    createdb -E UTF8 template_postgis
    createlang -d template_postgis plpgsql
    psql -d template_postgis -f $POSTGIS_PATH/postgis.sql
    psql -d template_postgis -f $POSTGIS_PATH/spatial_ref_sys.sql


For more info see: http://postgis.refractions.net/documentation/manual-1.5/ch02.html#id2619431


# Documentation

Tilemill documentation is kept in the gh-pages branch, which is independently managed and not merged with master.

Tilemill's in-app reference available as the "Manual" is a very small subset of docs for offline usage and is manually
sync'ed from the gh-pages branch.

To view all the TileMill documentation locally, first checkout the gh-pages branch:

    git checkout gh-pages

Then install Jekyll:

    sudo gem install jekyll

And run Jekyll:

    jekyll

Once Jekyll has started you should be able to view the docs in a browser at:

    http://localhost:4000/tilemill/
    
    
