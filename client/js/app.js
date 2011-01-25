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

        // Catchall error page requires a regex so we must add its route manually.
        this.controller.route(/^(.*?)/, 'error', Router.prototype.error);

        // Set body ID on each route page.
        // @TODO needs more sanitization.
        this.controller.bind('all', function(page) {
            $('body').attr('id', page.split(':').pop());
        });

        // Bootstrap:
        // 1. Fetch settings object from server.
        // 2. Begin routing.
        this.model.fetch({
            success: function(model) { Backbone.history.start(); },
            error: function(model) { Backbone.history.start(); }
        });
    },
    loading: function(message) {
        this.loadingView = new LoadingView({message: message});
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
        model: new Settings({ id: 'settings' })
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

/**
 * Miscellaneous models and views. @TODO move these to a util file or so?
 */
var Abilities = Backbone.Model.extend({
    url: function() {
        return '/api/abilities';
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

/**
 * View: SettingsPopupView
 */
var SettingsPopupView = PopupView.extend({
    events: _.extend({
        'click input.submit': 'submit'
    }, PopupView.prototype.events),
    initialize: function(params) {
        _.bindAll(this, 'render', 'submit');
        this.model = this.options.model;
        this.options.title = 'Settings';
        this.options.content = ich.SettingsPopupView({
            'minimal_mode': (this.model.get('mode') === 'minimal')
        }, true);
        this.render();
    },
    submit: function() {
        var success = this.model.set(
            { 'mode': $('select#mode', this.el).val() },
            { 'error': this.showError }
        );
        if (success) {
            this.model.save();
            this.remove();
        }
        return false;
    },
    showError: function(model, error) {
        window.app.message('Error', error);
    }
});

