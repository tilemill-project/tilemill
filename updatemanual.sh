#!/bin/sh

TILEMILL_GHPAGES="$(pwd)"
TILEMILL_SOURCES="${HOME}/tilemill"
rm -rf ${TILEMILL_SOURCES}/assets/manual
mkdir -p ${TILEMILL_SOURCES}/assets/manual
cp -r ${TILEMILL_GHPAGES}/assets/manual/* ${TILEMILL_SOURCES}/assets/manual/
git add ${TILEMILL_SOURCES}/assets/manual/*
rm -rf ${TILEMILL_SOURCES}/_posts/docs/reference
mkdir -p ${TILEMILL_SOURCES}/_posts/docs/reference
cp -r ${TILEMILL_GHPAGES}/_posts/docs/reference/* ${TILEMILL_SOURCES}/_posts/docs/reference/
git add ${TILEMILL_SOURCES}/_posts/docs/reference/*
