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
        window.app.activePopup = false;
        if ($.isFunction(this.options.after)) {
            this.options.after(this);
        }
        return false;
    },
    events: {
        'click .close': 'close'
    }
});

var DropdownView = Backbone.View.extend({
    className: 'DropdownView',
    initialize: function() {
        _.bindAll(this, 'render', 'showContent');
        this.render();
    },
    render: function() {
        $(this.el).html(ich.DropdownView(this.options));
        var that = this;
        $(window).bind('click', function() {
            that.hideContent();
        });
        return this;
    },
    events: {
        'click a.show': 'toggleContent'
    },
    toggleContent: function() {
        this.$('.dropdown-content').toggleClass('expanded');
        return false;
    },
    hideContent: function() {
        this.$('.dropdown-content').removeClass('expanded');
    }
});
