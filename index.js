#!/usr/bin/env node
process.title = 'tilemill';

require('tilelive-mapnik').registerProtocols(require('tilelive'));
require('mbtiles').registerProtocols(require('tilelive'));

require('bones').load(__dirname);
!module.parent && require('bones').start();
