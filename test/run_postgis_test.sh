#!/usr/bin/env bash
POSTGIS_SQL_PATH=`pg_config --sharedir`/contrib/postgis-1.5
createdb -E UTF8 tilemill_test # Create the template spatial database.
createlang -d tilemill_test plpgsql # Adding PLPGSQL language support.
psql -d tilemill_test -f $POSTGIS_SQL_PATH/postgis.sql # Loading the PostGIS SQL routines
psql -d tilemill_test -f $POSTGIS_SQL_PATH/spatial_ref_sys.sql
psql -d tilemill_test -c "GRANT ALL ON geometry_columns TO PUBLIC;" # Enabling users to alter spatial tables.
psql -d tilemill_test -c "GRANT ALL ON geography_columns TO PUBLIC;"
psql -d tilemill_test -c "GRANT ALL ON spatial_ref_sys TO PUBLIC;"
psql -d tilemill_test -f test/fixtures/admin_0_line_land.sql

NODE_ENV=test node bin/expresso test/postgis.test.js

psql -d postgres -c "DROP DATABASE tilemill_test;"
