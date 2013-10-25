CURRENT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd ${CURRENT_DIR}/../../
TILEMILL_ROOT=`pwd`
PATH=${TILEMILL_ROOT}/node_modules/.bin:${PATH}
BUILD_ROOT=${TILEMILL_ROOT}/node_root_dir
CXX_MODULES=$(find ${TILEMILL_ROOT}/node_modules -name binding.gyp | sed 's,/binding.gyp,/,g')
for i in ${CXX_MODULES}; do cd $i && node-gyp rebuild --nodedir=${BUILD_ROOT}; done

