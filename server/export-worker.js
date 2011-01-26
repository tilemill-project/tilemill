require.paths.unshift(
    __dirname + '/../lib/node',
    __dirname + '/../server',
    __dirname + '/../shared',
    __dirname + '/../'
);

var worker = require("worker").worker,
    Backbone = require('backbone-filesystem'),
    Project = require('project').Project,
    Export = require('project').Export;
 
worker.onmessage = function (msg) {
    this.model = new Export({id:msg.id});
    var that = this;
    this.model.fetch({
        success: function() {
            that.model.doExport(function(err) {
                that.postMessage({
                    success: !err
                });
            });
        }
    })
};
