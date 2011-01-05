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

