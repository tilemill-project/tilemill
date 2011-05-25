#!/usr/bin/env bash

createdb -E UTF8 tilemill_test
psql -d tilemill_test -f test/fixtures/tilemill_test.sql
NODE_ENV=test node bin/expresso test/postgis.test.js
psql -d postgres -c "DROP DATABASE tilemill_test;"
