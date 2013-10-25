
echo 'rebuilding node cxx modules'
CURRENT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd ${CURRENT_DIR}
echo "starting work in ${CURRENT_DIR}"
TILEMILL_ROOT=`pwd`
PATH=${TILEMILL_ROOT}/node_modules/.bin:${PATH}
PATH="`npm explore npm -g -- pwd`/bin/node-gyp-bin":${PATH}

RUN_SETUP=false
while getopts "s" OPT; do
    case $OPT in
        s)
           RUN_SETUP=true
           ;;
    esac
done

if [ "${RUN_SETUP}" = true ]; then
    NVER=`node -e "console.log(process.versions.node)"`
    echo "Running node-gyp setup for ${NVER}"
    node-gyp install ${NVER}
    BUILD_ROOT=${TILEMILL_ROOT}/node_root_dir
    cp -r ~/.node-gyp/${NVER}/ ${BUILD_ROOT}
    #rm -rf ~/.node-gyp/
fi
BUILD_ROOT=${TILEMILL_ROOT}/node_root_dir
CXX_MODULES=$(find ${TILEMILL_ROOT}/node_modules -name binding.gyp | sed 's,/binding.gyp,/,g')
for i in ${CXX_MODULES}; do cd $i && node-gyp rebuild --nodedir=${BUILD_ROOT}; done

