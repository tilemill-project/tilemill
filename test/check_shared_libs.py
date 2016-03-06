#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import sys
import fnmatch
import platform
import subprocess

if len(sys.argv) < 2:
    sys.stderr.write('please pass the path to a directory to search\n')
    exit(1)

matches = []
for root, dirnames, filenames in os.walk(sys.argv[1]):
  if platform.system() == 'Windows':
      for filename in fnmatch.filter(filenames, 'node.exe'):
          matches.append(os.path.join(root, filename))
  else:
      for filename in fnmatch.filter(filenames, 'node'):
          matches.append(os.path.join(root, filename))
  for filename in fnmatch.filter(filenames, '*.node'):
      matches.append(os.path.join(root, filename))
  if platform.system() == 'Windows':
      for filename in fnmatch.filter(filenames, '*.dll'):
          matches.append(os.path.join(root, filename))
  elif platform.system() == 'Darwin':
      for filename in fnmatch.filter(filenames, '*.dylib'):
          matches.append(os.path.join(root, filename))
  elif platform.system() == 'Linux':
      for filename in fnmatch.filter(filenames, '*.so'):
          matches.append(os.path.join(root, filename))

returncode = 0;

for match in matches:
    lib_returncode = 0
    if platform.system() == 'Windows':
        #call = subprocess.Popen(['dumpbin', '/DIRECTIVES', match],stdout=subprocess.PIPE)
        #print call.communicate()[0]
        call = subprocess.Popen(['dumpbin', '/DEPENDENTS', match], stdout=subprocess.PIPE)
        result = call.communicate()[0]
        bad_checks = ['LIBCMT','MSVCRTD','MSVCP120.dll']
        for bad_check in bad_checks:
            if bad_check in result:
                lib_returncode = 1
                sys.stderr.write('%s found in %s\n' % (bad_check,match))
        good_checks = ['VCRUNTIME140.dll','APPCRT140.dll','DESKTOPCRT140.dll']
        # exceptions that are known to not link to vs 2014 and this is okay
        # add runtime DLLs themselves to exceptions if they are copied into the modules directly
        exceptions = ['vcruntime140.dll','appcrt140.dll','desktopcrt140.dll','vcomp140.dll','nsProcess.dll','nsProcessW.dll','libcef.dll','icudt.dll','icudt53.dll','icudt54.dll', 'icudt56.dll','libexpat.dll','nsisFirewall.dll','nsisFirewallW.dll']
        found_one = False
        for good_check in good_checks:
            if good_check in result:
                found_one = True
        if not found_one and os.path.basename(match) not in exceptions:
            sys.stderr.write('vs140 runtimes not found in %s\n' % (match))
            lib_returncode = 1
    elif platform.system() == 'Darwin':
        call = subprocess.Popen(['otool', '-L', match], stdout=subprocess.PIPE)
        result = call.communicate()[0]
        if '/usr/local' in result:
            lib_returncode = 1
            sys.stderr.write('/usr/local found in %s' % match)
    elif platform.system() == 'Linux':
        call = subprocess.Popen(['ldd', match], stdout=subprocess.PIPE)
        result = call.communicate()[0]
        if '/usr/local' in result:
            lib_returncode = 1
            sys.stderr.write('/usr/local found in %s' % match)
    if lib_returncode == 0:
        sys.stdout.write('✓ %s is all good\n' % os.path.basename(match))
    else:
        returncode = lib_returncode
        sys.stderr.write('%s is broken\n' % os.path.basename(match))

exit(returncode)

