#!/bin/sh
POSTS=$1
if [ -z $POSTS ]; then
  POSTS=200
fi

echo "Light build ($POSTS posts) ..."
jekyll serve --watch --limit_posts $POSTS
