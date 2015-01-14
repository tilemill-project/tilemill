@rem for some reason this causes script to exit
@rem npm cache clean
call rd /q /s node_modules
call npm cache clean
call npm install --fallback-to-build=false --toolset=v140