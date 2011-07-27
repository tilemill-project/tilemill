#!/bin/sh

rm -rf ./test/fixtures/files/{app.db,project,data,export}
cp -r ./test/fixtures/pristine/project/* ./test/fixtures/files/project
