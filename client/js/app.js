var Router = Backbone.Controller.extend({
    routes: {
        '': 'list',
        'list': 'list',
        'project/:id': 'project'
    },
    list: function() {
        new ProjectListView({ collection: new ProjectList });
    },
    project: function(id) {
        new ProjectView({ model: new Project({ id: id }) });
    },
    error: function() {
        new ErrorView({ message: 'Page not found.' });
    }
});

var App = Backbone.View.extend({
    initialize: function(options) {
        this.settings = this.model;
        this.controller = new Router;
        this.abilities = this.options.abilities;

        // Catchall error page requires a regex so we must add its route manually.
        this.controller.route(/^(.*?)/, 'error', Router.prototype.error);

        // Set body ID on each route page.
        // @TODO needs more sanitization.
        this.controller.bind('all', function(page) {
            $('body').attr('id', page.split(':').pop());
        });

        // Bootstrap:
        // 1. Fetch settings, abilities objects from server.
        // 2. Begin routing.
        this.abilities.fetch();
        this.model.fetch({
            success: function(model) { Backbone.history.start(); },
            error: function(model) { Backbone.history.start(); }
        });
    },
    loading: function(message) {
        this.loadingView = new LoadingView({message: message});
        $(this.el).append(this.loadingView.el);
    },
    done: function() {
        this.loadingView.remove();
    },
    message: function(title, message, type, after) {
        type = type || 'status';
        if (!this.activePopup) {
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
});

$(function() {
    window.app = new App({
        el: $('body'),
        model: new Settings({ id: 'settings' }),
        abilities: new Abilities()
    });

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

