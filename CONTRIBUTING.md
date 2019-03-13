# Documentation

TileMill documentation is kept in the gh-pages branch, which is independently managed and not merged with master.

TileMill's in-app reference available as the "Manual" (see below for syncing details) is a very small subset of docs for offline usage and is manually sync'ed from the gh-pages branch.

To view all the TileMill documentation locally, first checkout the gh-pages branch:

    git clone -b gh-pages https://github.com/tilemill-project/tilemill.git tilemill-gh-pages

Check your Ruby version. If the version is not V2.X.X or higher, then you need to upgrade your Ruby installation:

    ruby --version

Install Jekyll and bundler:

    sudo gem install jekyll bundler
    cd tilemill-gh-pages

Create/update Gemfile. If you have a Gemfile, add the following lines to it. If you don't, then create a file named "Gemfile" and add the following lines to it.:
    source 'https://rubygems.org'
    gem 'github-pages', group: :jekyll_plugins

Install the site:

    bundle install

And run Jekyll:

    ./.runjekyll.sh

Once Jekyll has started you should be able to view the docs in a browser at:

    [http://127.0.0.1:4000/tilemill/](http://127.0.0.1:4000/tilemill/)

If you have problems, you can check out this reference [Setting Up GitHub Pages with Jekyll](https://help.github.com/articles/setting-up-your-github-pages-site-locally-with-jekyll). You just don't need to do the git steps where they are creating a new git branch or documentation files since those already exist.

# Syncing manual from gh_pages into the TileMill application

This assumes that you already have tilemill checked out in your HOME directory. If you don't have the gh-pages branch checked out, start by checking it out:

    cd ${HOME}
    git clone -b gh-pages https://github.com/tilemill-project/tilemill tilemill-gh-pages

To sync the manual in the app with gh-pages updates do:

    ./updatemanual.sh
