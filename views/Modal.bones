view = Backbone.View.extend();

view.prototype.events = {
    'click a[href=#close]': 'close',
    'click input.ok': 'ok',
    'click input.cancel': 'close'
};

// Override _ensureElement.
view.prototype._ensureElement = function() {
    this.el = this.el || $('#modal');
};

view.prototype.initialize = function(options) {
    _(this).bindAll('render', 'ok', 'close');

    // Attempt to handle jqXHR objects.
    if (options.responseText) {
        try {
            options = { content: JSON.parse(options.responseText).message };
        } catch(e) {
            options = { content: options.responseText };
        }
    } else if (options.status === 0) {
        options = { content: 'No response from server.' };
    } else if (typeof options === 'string') {
        options = { content: options };
    } else if (options instanceof Error) {
        options = { content: options.toString() };
    }

    options = options || {};
    options.content = options.content || {};
    options.type = options.callback ? 'confirm' : 'message';
    this.options = options;
    this.render();
};

view.prototype.render = function() {
    $('body').addClass('overlay');
    $(this.el).addClass('active');
    $(this.el).html(templates.Modal(this.options));
    return this;
};

view.prototype.close = function() {
    if (!$('#popup.active').size()) $('body').removeClass('overlay');
    $(this.el).removeClass('active');
    return false;
};

view.prototype.ok = function() {
    this.options.callback();
    return this.close();
};

