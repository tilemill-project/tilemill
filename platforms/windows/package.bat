set DEVROOT=c:\dev2
set DEST=node_modules
set MAPNIK_INSTALL=c:\mapnik-2.0
set NODEEXE=c:\node\Release\node.exe

cd ..\..\

rd /q /s %DEST%\mapnik
xcopy /i /s /exclude:platforms\windows\excludes.txt %DEVROOT%\node-mapnik %DEST%\mapnik
rd /q /s %DEST%\zipfile
xcopy /i /s /exclude:platforms\windows\excludes.txt %DEVROOT%\node-zipfile %DEST%\zipfile
rd /q /s %DEST%\srs
xcopy /i /s /exclude:platforms\windows\excludes.txt %DEVROOT%\node-srs %DEST%\srs
rd /q /s %DEST%\sqlite3
xcopy /i /s /exclude:platforms\windows\excludes.txt %DEVROOT%\node-sqlite3 %DEST%\sqlite3
rd /q /s %DEST%\contextify
xcopy /i /s /exclude:platforms\windows\excludes.txt %DEVROOT%\contextify %DEST%\contextify
rd /q /s mapnik-2.0
xcopy /i /s %MAPNIK_INSTALL% mapnik-2.0
rd /q /s data\proj
xcopy /i /s %DEVROOT%\proj\nad data\proj\nad
rd /q /s data\gdal
xcopy /i /s %DEVROOT%\gdal\data data\gdal\data
xcopy /i /s %NODEEXE% node.exe