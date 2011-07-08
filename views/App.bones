view = Backbone.View.extend();

view.prototype.events = {
    'click #popup a[href=#close]': 'popupClose',
    'click a.popup': 'popupOpen',
    'click #drawer a[href=#close]': 'drawerClose',
    'click a.drawer': 'drawerOpen'
};

view.prototype.initialize = function() {
    _(this).bindAll('popupOpen', 'popupClose', 'drawerOpen', 'drawerClose');
};

view.prototype.popupOpen = function(ev) {
    var target = $(ev.currentTarget);
    var title = target.text() || target.attr('title');

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

