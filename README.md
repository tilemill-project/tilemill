TileMill is a modern map design studio powered by open source technology.
Installation instructions, development docs and other information are available
on the [TileMill website](http://mapbox.com/tilemill).

- [Download and install](http://mapbox.com/tilemill/download/)
- [Build from source](http://mapbox.com/tilemill/docs/source/)


# Running tests

Install expresso and run the tests

   npm install expresso
   npm test


Note: the tests require a running postgres server and a postgis enabled
database called `template_postgis`.


# Viewing docs locally

## Install jekyll

    sudo gem install jekyll

## Run jekyll

    jekyll

## View the site at:

    http://localhost:4000/tilemill/docs/
