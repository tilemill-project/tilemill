// Router
// ------
// Route rules for TileMill client. Only a small subset of possible states
// are represented here, but the major ones are covered.
var Router = Backbone.Controller.extend({
    routes: {
        '': 'library',
        'library/:id': 'library',
        'project/:id': 'project',
        'project/:id/export': 'projectExport',
        'project/:id/export/:format': 'projectExportFormat'
    },
    library: function(id, next) {
        var that = this;
        (new LibraryList()).fetch({
            success: function(collection) {
                var view = new LibraryListView({
                    collection: collection,
                    active: id
                });
                window.app.page(view);
                next && next();
            },
            error: that.error
        });
    },
    project: function(id, next) {
        var that = this;
        (new Project({ id: id })).fetch({
            success: function(model) {
                var view = new ProjectView({ model: model });
                window.app.page(view);
                next && next();
            },
            error: that.error
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
        var view = new ErrorView({ message: 'Page not found' });
        window.app.page(view);
    }
});

// App
// ---
// View. Represents the entire application "viewport", aka the entire page.
// Available in the global namespace as `window.app` and contains various
// useful utility methods.
var App = Backbone.View.extend({
    initialize: function(options) {
        this.settings = this.model;
        this.controller = new Router();
        this.abilities = this.options.abilities;
        this.reference = this.options.reference;

        // Catchall error page requires a regex so we must add its route manually.
        this.controller.route(/^(.*?)/, 'error', Router.prototype.error);

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
    // Return the base URL of TileMill including a single trailing slash,
    // e.g. http://localhost:8889/ or http://mapbox/tilemill/
    baseURL: function() {
        var baseURL = window.location.protocol + '//' + window.location.host;
        var args = window.location.pathname.split('/');
        // Path already ends with trailing slash.
        if (args[args.length - 1] === '') {
            return baseURL + args.join('/');
        // index.html or similar trailing filename.
        } else if (_.indexOf(args[args.length - 1], '.') !== -1) {
            args.pop();
            return baseURL + args.join('/') + '/';
        // Path beyond domain.
        } else {
            return baseURL + args.join('/') + '/';
        }
    },
    // URL-safe base64 encode a string. Optionally add a datestamp based
    // querystring.
    safe64: function(url, signed) {
        _.isUndefined(signed) && (signed = true);
        signed && (url += '?' + ('' + (+new Date)).substring(0,10));
        return Base64.encodeURI(url);
    },
    // Set the application page viweport to the provided view. Triggers a
    // `ready` event for any behaviors that expect DOM elements to be present
    // in the document before attaching/initing (e.g. CodeMirror, OpenLayers).
    page: function(view) {
        $('.tipsy').remove();
        $(this.el).html(view.el);
        this.pageView = view;
        this.trigger('ready');
    },
    // Display a loading overlay over the page viewport.
    loading: function(message) {
        this.loadingView = new LoadingView({message: message});
        $(this.el).append(this.loadingView.el);
    },
    // Remove a loading overlay from the page viewport.
    done: function() {
        this.loadingView.remove();
        delete this.loadingView;
    },
    // Display a popup message.
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

// Application bootstrap.
$(function() {
    // Fix for IE8 AJAX payload caching.
    // See: http://stackoverflow.com/questions/1013637/unexpected-caching-of-ajax-results-in-ie8
    $.ajaxSetup({ cache: false });

    // Create the app.
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

