var Router = Backbone.Controller.extend({
    routes: {
        '': 'list',
        'list': 'list',
        'reference': 'reference',
        'project/:id': 'project',
        'visualization/:id': 'visualization'
    },
    list: function() { new ListView(); },
    project: function(id) { new ProjectView({ id: id }); },
    visualization: function(id) { new VisualizationView({ id: id }); },
    reference: function() { new ReferenceView(); }
});

var App = function() {
    this.el = $('body');
    this.controller = new Router;

    // Set body ID on each route page.
    // @TODO needs more sanitization.
    this.controller.bind('all', function(page) {
        $('body').attr('id', page.split(':').pop());
    });

    this.loading = function(message) {
        $('body').append(ich.loading({message: message}));
    }

    this.done = function() {
        $('#loading').remove();
    }

    this.message = function(title, message, type) {
        type = type || 'status';
        new PopupView({
            title: title,
            content: ich.PopupMessage({
                message: message,
                type: type
            }, true)
        });
    };
};

var PopupView = Backbone.View.extend({
    initialize: function () {
        _.bindAll(this, 'render');
        this.render();
    },
    render: function () {
        $(this.el).html(ich.PopupView(this.options));
        window.app.el.append(this.el);
        return this;
    },
    events: {
        'click .popup-close': 'remove'
    }
});

$(function() {
    window.app = new App();
    Backbone.history.start();
});

