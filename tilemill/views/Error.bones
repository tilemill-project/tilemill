view = Backbone.View.extend();

// Override _ensureElement.
view.prototype._ensureElement = function() {
    this.el = this.el || $('#page');
};

view.prototype.initialize = function(options) {
    _(this).bindAll('render');

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
    this.options = options;
    this.render();
};

view.prototype.render = function() {
    $(this.el).html(templates.Error(this.options));
    return this;
};

