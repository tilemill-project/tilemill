view = Backbone.View.extend();

view.prototype.events = {
    'click #popup a[href=#close], #popup input.cancel': 'popupClose',
    'click a.popup': 'popupOpen',
    'click #drawer a[href=#close]': 'drawerClose',
    'click a.drawer': 'drawerOpen',
    'click .button.dropdown, .button.dropdown a': 'dropdown',
    'click .toggler a': 'toggler',
    'keydown': 'keydown'
};

view.prototype.initialize = function() {
    _(this).bindAll(
        'popupOpen',
        'popupClose',
        'drawerOpen',
        'drawerClose',
        'toggler',
        'keydown',
        'dropdown'
    );
};

view.prototype.popupOpen = function(ev) {
    var target = $(ev.currentTarget);
    var title = target.attr('title') || target.text();

    $(this.el).addClass('overlay');
    this.$('#popup').addClass('active');
    this.$('#popup > .title').text(title);
    return false;
};

view.prototype.popupClose = function(ev) {
    $(this.el).removeClass('overlay');
    this.$('#popup').removeClass('active');
    return false;
};

view.prototype.drawerOpen = function(ev) {
    var target = $(ev.currentTarget);

    // Close drawers when the target is active.
    if (target.is('.active')) return this.drawerClose();

    var title = target.text() || target.attr('title');
    this.$('.drawer.active').removeClass('active');
    target.addClass('active');
    this.$('#drawer').addClass('active');
    this.$('#drawer > .title').text(title);
    return false;
};

view.prototype.drawerClose = function(ev) {
    this.$('a.drawer.active').removeClass('active');
    this.$('#drawer').removeClass('active');
    return false;
};

view.prototype.toggler = function(ev) {
    var link = $(ev.currentTarget);
    var parent = link.parents('.toggler');
    var target = link.attr('href').split('#').pop();

    $('a', parent).removeClass('active');
    this.$('.' + target).siblings('.active').removeClass('active');

    link.addClass('active');
    this.$('.' + target).addClass('active');
    return false;
};

view.prototype.keydown = function(ev) {
    // Escape
    if (ev.which == 27 && (!ev.ctrlKey && !ev.metaKey && !ev.altKey)) {
        // @TODO for some reason a function bound from the Modal view
        // to a keydown event is not fired. Probably related to
        // event delegation/bubbling?
        if (this.$('#modal.active').size()) {
            if (!$('#popup.active').size()) $('body').removeClass('overlay');
            this.$('#modal.active').removeClass('active');
        } else if (this.$('#popup.active').size()) {
            this.popupClose();
        } else if (this.$('#drawer.active').size()) {
            this.drawerClose();
        }
        return false;
    }
    // Ctrl + S
    // The keydown event is only passed to a specific view if an form
    // element in that view has focus. When no form element has focus
    // the top most view takes precedence and the event is *not* bubbled
    // down (http://api.jquery.com/keydown). This code conceptually belongs
    // in `Project.bones` but is handled here as the App is the one to
    // receive the event.
    if (ev.which == 83 &&
        ((ev.ctrlKey || ev.metaKey) && !ev.altKey)) {
        this.$('.actions a[href=#save]').click();
        return false;
    }
};

view.prototype.dropdown = function(ev) {
    var target = $(ev.currentTarget);
    if (!target.is('.dropdown')) target = target.parents('.button.dropdown');
    var app = this.el;
    if (!target.hasClass('active')) {
        target.addClass('active');
        $(app).bind('click', collapse);
    }
    function collapse(ev) {
        target.removeClass('active');
        $(app).unbind('click', collapse);
    }

    return false;
};
