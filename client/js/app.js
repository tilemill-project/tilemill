var Router = Backbone.Controller.extend({
    routes: {
        '': 'list',
        'list/:library': 'list',
        'project/:id': 'project',
        'project/:id/export': 'projectExport',
        'project/:id/export/:format': 'projectExportFormat'
    },
    list: function(library, next) {
        (new LibraryList()).fetch({
            success: function(collection) {
                var view = new LibraryListView({
                    collection: collection,
                    library: library
                });
                window.app.page(view);
                next && next();
            },
            error: function(collection, resp) {
                var view = new ErrorView({ message: 'Page not found' });
                window.app.page(view);
            }
        });
    },
    project: function(id, next) {
        new Project({ id: id}).fetch({
            success: function(model) {
                var view = new ProjectView({ model: model });
                window.app.page(view);
                next && next();
            },
            error: function(model, resp) {
                var view = new ErrorView({ message: resp });
                window.app.page(view);
            }
        });
    },
    projectExport: function(id, next) {
        this.project(id, function() {
            window.app.pageView.views.exportDropdown.jobs();
            next && next();
        });
    },
    projectExportFormat: function(id, format, next) {
        this.project(id, function() {
            window.app.pageView.views.exportDropdown.xport(format);
            next && next();
        });
    },
    error: function() {
        new ErrorView({ message: 'Page not found' });
        window.app.page(view);
    }
});

var App = Backbone.View.extend({
    initialize: function(options) {
        this.settings = this.model;
        this.controller = new Router();
        this.abilities = this.options.abilities;
        this.reference = this.options.reference;

        // Catchall error page requires a regex so we must add its route manually.
        this.controller.route(/^(.*?)/, 'error', Router.prototype.error);

        // Set body ID on each route page.
        // @TODO needs more sanitization.
        this.controller.bind('all', function(page) {
            $('body').attr('id', page.split(':').pop());
        });

        // Watch status of server and show message if the server is down.
        this.status = new Status('api', function(status) {
            window.app.message('Server down', 'The TileMill server could not be reached.', 'error');
        }, 5000);

        // Bootstrap:
        // 1. Fetch settings, abilities, reference objects from server.
        // 2. Begin routing.
        this.abilities.fetch();
        this.reference.fetch();

        this.model.fetch({
            success: function(model) { Backbone.history.start(); },
            error: function(model) { Backbone.history.start(); }
        });
    },
    page: function(view) {
        $('.tipsy').remove();
        $(this.el).html(view.el);
        this.pageView = view;
        this.trigger('ready');
    },
    loading: function(message) {
        this.loadingView = new LoadingView({message: message});
        $(this.el).append(this.loadingView.el);
    },
    done: function() {
        this.loadingView.remove();
        delete this.loadingView;
    },
    message: function(title, message, type) {
        type = type || 'status';
        message.responseText && (message = message.responseText);
        new PopupView({
            title: title,
            content: ich.PopupMessage({
                message: message,
                type: type
            }, true)
        });
    }
});

$(function() {
    // Fix for IE8 AJAX payload caching.
    // See: http://stackoverflow.com/questions/1013637/unexpected-caching-of-ajax-results-in-ie8
    $.ajaxSetup({ cache: false });

    window.app = new App({
        el: $('#app'),
        model: new Settings({ id: 'settings' }),
        abilities: new Abilities(),
        reference: new Reference()
    });

   // Use jquery.tipsy for displaying tooltips.
   $('a').tipsy({
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

