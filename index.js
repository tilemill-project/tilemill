var internals = {};

exports.register = function (server, pluginOptions, next) {

    var fakeArgs = "--server=true --files=/home/pvieira/tilemill-files --port=20019 --tilePort=20018 --coreUrl=clima.dev --tileUrl=clima.dev --updates=0";

    if(pluginOptions.files){
        fakeArgs += " files=" + pluginOptions.files;
    }
    if(pluginOptions.port){
        fakeArgs += " port=" + pluginOptions.port;
    }
    if(pluginOptions.tilePort){
        fakeArgs += " tilePort=" + pluginOptions.tilePort;
    }
    if(pluginOptions.coreUrl){
        fakeArgs += " coreUrl=" + pluginOptions.coreUrl;
    }
    if(pluginOptions.tileUrl){
        fakeArgs += " tileUrl=" + pluginOptions.tileUrl;
    }
    if(pluginOptions.updates){
        fakeArgs += " updates=" + pluginOptions.updates;
    }

    process.argv = process.argv.concat(fakeArgs.split(" "));

    console.log("Tilemill will start in 3 seconds");

    setTimeout(function(){
        console.log("Starting Tilemill");
        require("./index");
    }, 500);

};

exports.register.attributes = {
    pkg: require('package.json')
};
