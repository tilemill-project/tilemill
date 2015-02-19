:: tested only with nsis 2.46
:: this is for testing the installer locally on a windows machine

del /q /s .\install-tilemill.exe
CALL "C:\Program Files (x86)\NSIS\makensis" ^
 -V3 ^
 -DTARGET_ARCH=x64 ^
 -DSOURCE_ROOT=..\ ^
 -DOUTPUT_FILE=.\install-tilemill.exe ^
 -DVERSION=test ^
 tilemill.nsi
::pause