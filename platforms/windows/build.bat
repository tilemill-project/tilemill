@rem for some reason this causes script to exit
@rem npm cache clean
rd /q /s node_modules
npm install --force --no-rollback