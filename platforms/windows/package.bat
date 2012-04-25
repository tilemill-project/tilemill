set DEVROOT=c:\dev2
@rem place c++ addons outside of node_modules for now
@rem to make it easier to remove/recreate node_modules
set DEST=addons
set MAPNIK_INSTALL=c:\mapnik-2.0
set NODEEXE=c:\node\Release\node.exe
set MAPNIK_DEST=%DEST%\mapnik\lib\mapnik

@rem make sure Python is on the PATH
set PATH=%PATH%;c:\Python27

@rem change into current directory
cd /d %~dp0
@rem then move to main tilemill folder
cd ..\..\
set TILEMILL_DIR=%CD%

mkdir %DEST%

@rem remove then re-copy node-mapnik
rd /q /s %DEST%\mapnik
xcopy /i /s /exclude:platforms\windows\excludes.txt %DEVROOT%\node-mapnik %DEST%\mapnik

@rem fixup paths to plugins making them relative 
@rem to future location of mapnik itself
cd %DEST%\mapnik
@rem - note, intentially not quoting the below
set MAPNIK_INPUT_PLUGINS=path.join(__dirname, 'mapnik/lib/mapnik/input')
set MAPNIK_FONTS=path.join(__dirname, 'mapnik/lib/mapnik/fonts')
python gen_settings.py
chdir /d %TILEMILL_DIR%
@rem symlink mapnik into main directory so npm is happy
@rem mklink /d /j node_modules/mapnik %DEST%/mapnik

@rem - handle mapnik itself
rd /q /s %MAPNIK_DEST%
xcopy /i /s %MAPNIK_INSTALL% %MAPNIK_DEST%

@rem - move all other C++ addons into place
rd /q /s %DEST%\zipfile
xcopy /i /s /exclude:platforms\windows\excludes.txt %DEVROOT%\node-zipfile %DEST%\zipfile
rd /q /s %DEST%\srs
xcopy /i /s /exclude:platforms\windows\excludes.txt %DEVROOT%\node-srs %DEST%\srs
rd /q /s %DEST%\sqlite3
xcopy /i /s /exclude:platforms\windows\excludes.txt %DEVROOT%\node-sqlite3 %DEST%\sqlite3
rd /q /s %DEST%\contextify
xcopy /i /s /exclude:platforms\windows\excludes.txt %DEVROOT%\contextify %DEST%\contextify

@rem - todo find better spot for this data
rd /q /s data\proj
xcopy /i /s %DEVROOT%\proj\nad data\proj\nad
rd /q /s data\gdal
xcopy /i /s %DEVROOT%\gdal\data data\gdal\data
rd /q /s node.exe
xcopy %NODEEXE% %TILEMILL_DIR%\node.exe
