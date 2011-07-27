#!/bin/sh

rm -rf ./test/fixtures/files/{app.db,project,data,export}
cp -r ./test/fixtures/pristine/project/* ./test/fixtures/files/project

# psql -d postgres -c "DROP DATABASE IF EXISTS tilemill_test;"
# createdb -E UTF8 tilemill_test
# psql -d tilemill_test -f test/fixtures/tilemill_test.sql
