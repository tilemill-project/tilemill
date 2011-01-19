var Router = Backbone.Controller.extend({
    routes: {
        '': 'list',
        'list': 'list',
        'project/:id': 'project',
        'visualization/:id': 'visualization'
    },
    list: function() {
        new ProjectListView({ collection: new ProjectList });
    },
    project: function(id) {
        new ProjectView({ model: new Project({ id: id }) });
    },
    visualization: function(id) {
        new VisualizationView({ id: id });
    },
    error: function() {
        new ErrorView({ message: 'Page not found.' });
    }
});


var App = function() {
    this.el = $('body');
    this.controller = new Router;

    // Catchall error page requires a regex so we must add its route manually.
    this.controller.route(/^(.*?)/, 'error', Router.prototype.error);

    // Set body ID on each route page.
    // @TODO needs more sanitization.
    this.controller.bind('all', function(page) {
        $('body').attr('id', page.split(':').pop());
    });

    this.loading = function(message) {
        this.loadingView = new LoadingView({message: message});
    }

    this.done = function() {
        this.loadingView.remove();
    }

    this.message = function(title, message, type, after) {
        type = type || 'status';
        if (!this.activePopup) {
            if (type == 'projectInfo') {
                this.activePopup = new PopupView({
                    title: title,
                    content: ich.PopupProjectInfo({
                        tilelive_url: message.tilelive_url,
                        mml_url: message.mml_url,
                        type: type
                    }, true),
                    after: after
                });
            }
            else {
                this.activePopup = new PopupView({
                    title: title,
                    content: ich.PopupMessage({
                        message: message,
                        type: type
                    }, true),
                    after: after
                });
            }
        }
    };
};

var Abilities = Backbone.Model.extend({
    url: function() {
        return '/abilities';
    }
});

var LoadingView = Backbone.View.extend({
    initialize: function () {
        _.bindAll(this, 'render');
        this.render();
    },
    render: function () {
        $(this.el).html(ich.LoadingView(this.options));
        window.app.el.append(this.el);
        return this;
    }
});

var ErrorView = Backbone.View.extend({
    initialize: function () {
        _.bindAll(this, 'render');
        this.render();
    },
    render: function () {
        $(this.el).html(ich.ErrorView(this.options));
        window.app.el.html(this.el);
        return this;
    }
});

$(function() {
    window.app = new App();
    _.extend(window.app, Backbone.Events);
    Backbone.history.start();

   // Use jquery.tipsy for displaying tooltips.
   $('a', this.el).tipsy({
        live:true,
        html:true,
        gravity: function() {
            if ($(this).is('.tipsy-w')) { return 'w'; }
            if ($(this).is('.tipsy-e')) { return 'e'; }
            if ($(this).is('.tipsy-n')) { return 'n'; }
            return 's';
        }
    });
});

