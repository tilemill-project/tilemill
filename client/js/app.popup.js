var PopupView = Backbone.View.extend({
    initialize: function () {
        _.bindAll(this, 'render');
        this.render();
    },
    render: function () {
        $(this.el).html(ich.PopupView(this.options));
        var that = this;
        $('body').keyup(function(e) {
          if (e.keyCode == 27) { that.close() }   // esc
        });
        window.app.el.append(this.el);
        return this;
    },
    close: function() {
        this.remove();
        return false;
    },
    events: {
        'click .popup-close': 'close'
    }
});

