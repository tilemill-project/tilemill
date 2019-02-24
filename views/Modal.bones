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

    options = options || {};

    // Attempt to handle jqXHR objects.
    if (options.responseText) {
        console.log(options.responseText);
        try {
            var message = JSON.parse(options.responseText).message
            if (message == undefined) throw new Error("");
            options = {
              content: message
            };
        } catch(e) {
            options = {
              content: options.responseText
            };
        }
    } else if (options.status === 0) {
        var content = '';
        if (options.err_message) {
           content += options.err_message + ' : ';
        }
        content += 'Unable to reach the local TileMill Server. Check the logs for details. If this problem persists please log a bug at: https://github.com/tilemill-project/tilemill/issues';
        options = { content: content };
    } else if (typeof options === 'string') {
        options = { content: options };
    } else if (options instanceof Error) {
        options = { content: options.toString() };
    }

    // Modals with a callback are requesting confirmation.
    options.type = options.callback ? 'confirm' : 'message';

    this.options = _(options).defaults({
        content: {},
        affirmative: 'Ok',
        negative: 'Cancel'
    });
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

