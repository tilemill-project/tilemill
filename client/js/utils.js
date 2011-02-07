// Watcher
// -------
// Class for polling a given model (or collection) and firing a callback
// when it changes.
//
// - `model` model to watch
// - `callback` function to call when a change occurs to the model
// - `interval` interval to polling the server (in milliseconds)
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

// Status
// ------
// Class for polling a certain endpoint and firing a callback if it is down.
//
// - `url` URL to poll
// - `callback` function to call if the URL request results in an error
// - `interval` interval to poll the URL (in milliseconds)
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

// PopupView
// ---------
// View. Modal popup base class. Extending classes should populate the
// following properties on `initialize()`:
//
// - `this.options.title` title text of the popup
// - `this.options.content` HTML string of the popup contents. Use
//   the render as string second argument of `ich[template].()` to
//   render a mustache template to a string.
// - `this.options.className` an additional HTML class to attach to
//   the popup div.
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

// DropdownView
// ------------
// View. Dropdown menu base class. Extending classes should populate the
// following properties on `initialize()`:
//
// - `this.options.title` text for the dropdown menu button
// - `this.options.content` HTML string of dropdown contents
var DropdownView = Backbone.View.extend({
    className: 'DropdownView',
    initialize: function() {
        _.bindAll(this, 'render', 'showContent', 'hideContent');
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

// DrawerView
// ----------
// View. Twitter-style slideout drawer base class. Because the rendering of
// this view is animated, it's recommended that any loading/rendering of the
// contents of your drawer be bound using the `view.bind('render')` event.
//
// - `this.options.title` text for drawer title
// - `this.options.content` HTML string of drawer contents
var DrawerView = Backbone.View.extend({
    className: 'drawer',
    events: {
        'click .close': 'remove'
    },
    initialize: function () {
        _.bindAll(this, 'render', 'loading', 'done');
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
    },
    loading: function(message) {
        this.loadingView = new LoadingView({message: message});
        this.$('.drawer-content').append(this.loadingView.el);
    },
    done: function() {
        this.loadingView && this.loadingView.remove();
    }
});

// LoadingView
// -----------
// Loading overlay. Populate `options.message` to show text giving the user
// context about what is loading.
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

// ErrorView
// ---------
// Page view. Error, like a 404.
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

// SettingsPopupView
// -----------------
// App-wide settings form.
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

