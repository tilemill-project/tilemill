# Help script for running tests
test -d test/files && rm -r test/files
NODE_ENV=test ./bin/expresso --serial --port 8889 $*
