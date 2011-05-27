#!/usr/bin/env node
process.title = 'tilemill';
require('bones').load(__dirname);
!module.parent && require('bones').start();
