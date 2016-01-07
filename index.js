var internals = {};

exports.register = function (server, pluginOptions, next) {

    var fakeArgs = "--server=true";

    if(pluginOptions.files){
        fakeArgs += " --files=" + pluginOptions.files;
    }
    if(pluginOptions.port){
        fakeArgs += " --port=" + pluginOptions.port;
    }
    if(pluginOptions.tilePort){
        fakeArgs += " --tilePort=" + pluginOptions.tilePort;
    }
    if(pluginOptions.coreUrl){
        fakeArgs += " --coreUrl=" + pluginOptions.coreUrl;
    }
    if(pluginOptions.tileUrl){
        fakeArgs += " --tileUrl=" + pluginOptions.tileUrl;
    }
    if(pluginOptions.updates){
        fakeArgs += " --updates=" + pluginOptions.updates;
    }

    var delay = pluginOptions.delay || 1;

    process.argv = process.argv.concat(fakeArgs.split(" "));

    console.log("Tilemill will start in " + delay + " seconds");

    setTimeout(function(){
        console.log("Starting Tilemill");
        require("./tilemill/index");
    }, delay*1000);


    return next();
};

exports.register.attributes = {
    pkg: require('./package.json')
};

