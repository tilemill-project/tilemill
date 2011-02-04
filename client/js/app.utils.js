/**
 * Watcher.
 *
 * Class for polling a given model (or collection) and firing a callback
 * when it changes.
 */
var Watcher = function(model, callback, interval) {
    _.bindAll(this, 'fetch', 'destroy');
    var model = model;
    this.model = model;
    this.model.bind('change', this.fetch);
    this.callback = callback;
    this.interval = interval || 1000;
    this.current = JSON.stringify(this.model);
    this.watcher = setInterval(function() { model.fetch(); }, this.interval);
};

Watcher.prototype.fetch = function() {
    var state = JSON.stringify(this.model);
    if (this.current !== state) {
        this.current = state;
        this.callback && this.callback();
    }
};

Watcher.prototype.destroy = function() {
    window.clearInterval(this.watcher);
};

/**
 * Status.
 *
 * Class for polling a certain endpoint and firing a callback if it is down.
 */
var Status = function(url, callback, interval) {
    _.bindAll(this, 'start', 'error', 'stop');
    this.url = url;
    this.callback = callback;
    this.interval = interval || 1000;
    this.start();
};

Status.prototype.start = function() {
    if (!this.watcher) {
        var that = this;
        this.watcher = setInterval(function() {
            $.ajax({
                url: that.url,
                type: 'GET',
                error: that.error
            });
        }, this.interval);
    }
};

Status.prototype.error = function() {
    this.stop();
    this.callback(this);
};

Status.prototype.stop = function() {
    if (this.watcher) {
        window.clearInterval(this.watcher);
        delete this.watcher;
    }
};

/**
 * View: PopupView
 *
 * Modal popup.
 */
var PopupView = Backbone.View.extend({
    initialize: function () {
        _.bindAll(this, 'render');
        this.render();
    },
    render: function () {
        $(this.el).html(ich.PopupView(this.options));
        $('.overlay').size() && this.$('.overlay').remove();
        var that = this;
        $('body').keyup(function(e) {
            if (e.keyCode == 27) { that.close() } // esc
        });
        window.app.el.append(this.el);
        return this;
    },
    loading: function(message) {
        this.loadingView = new LoadingView({message: message});
        this.$('.popup').append(this.loadingView.el);
    },
    done: function() {
        this.loadingView && this.loadingView.remove();
    },
    close: function() {
        this.remove();
        window.app.activePopup = false;
        return false;
    },
    events: {
        'click .close': 'close'
    },
    showError: function(model, error) {
        window.app.message('Error', error);
    }
});

/**
 * View: DropdownView
 *
 * Dropdown menu.
 */
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
        this.$('.show').toggleClass('active');
        this.$('.dropdown-content').toggleClass('expanded');
        return false;
    },
    hideContent: function() {
        this.$('.show').removeClass('active');
        this.$('.dropdown-content').removeClass('expanded');
    }
});

/**
 * View: DrawerView
 *
 * Slideout drawer from the left side of the screen.
 */
var DrawerView = Backbone.View.extend({
    className: 'drawer',
    events: {
        'click .close': 'remove'
    },
    initialize: function () {
        _.bindAll(this, 'render');
        this.render();
    },
    render: function () {
        // Mark any existing drawers as stale to be removed after this new
        // drawer has finished rendering.
        $('.drawer').addClass('staleDrawer');
        var that = this;
        window.app.el.append($(this.el));
        $(this.el).html(ich.DrawerView(this.options));
        $(this.el).animate({left: '0%'}, function() {
            $('.staleDrawer').remove();
            that.trigger('render');
        });
        return this;
    },
    remove: function() {
        $('.drawer-content', this.el).children().fadeOut('fast');
        $(this.el).animate( {left: '-100%'}, function() { $(this).remove() });
        return false;
    }
});

/**
 * View: LoadingView
 *
 * Load indicator overlay.
 */
var LoadingView = Backbone.View.extend({
    initialize: function () {
        _.bindAll(this, 'render');
        this.render();
    },
    render: function () {
        $(this.el).html(ich.LoadingView(this.options));
        return this;
    }
});

/**
 * View: ErrorView
 *
 * Error page.
 */
var ErrorView = Backbone.View.extend({
    initialize: function () {
        _.bindAll(this, 'render');
        if (typeof this.options.message === 'object' && this.options.message.responseText) {
            this.options.message = this.options.message.responseText;
        }
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
 *
 * Settings form. Extends PopupView.
 */
var SettingsPopupView = PopupView.extend({
    events: _.extend({
        'click input.submit': 'submit'
    }, PopupView.prototype.events),
    initialize: function(params) {
        _.bindAll(this, 'render', 'submit');
        this.model = this.options.model;
        this.options.title = 'TileMill settings';
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
    }
});

