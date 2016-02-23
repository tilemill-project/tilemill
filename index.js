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

    if(pluginOptions.db_host){
        fakeArgs += " --db_host=" + pluginOptions.db.host;
    }
    if(pluginOptions.db_port){
        fakeArgs += " --db_port=" + pluginOptions.db.port;
    }
    if(pluginOptions.db_user){
        fakeArgs += " --db_user=" + pluginOptions.db.user;
    }
    if(pluginOptions.db_password){
        fakeArgs += " --db_password=" + pluginOptions.db.password;
    }
    if(pluginOptions.db_database){
        fakeArgs += " --db_database=" + pluginOptions.db.database;
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

