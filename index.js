#!/usr/bin/env node
process.title = 'tilemill';


var tilelive_mapnik = require('tilelive-mapnik');
tilelive_mapnik.registerProtocols(require('tilelive'));

require('bones').load(__dirname);
!module.parent && require('bones').start();
