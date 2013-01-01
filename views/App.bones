Bones.utils.until = function(url, callback) {
    $.ajax({
        url: url,
        success: callback,
        error: function() { setTimeout(function() {
            Bones.utils.until(url, callback);
        }, 500); }
    });
};

Bones.utils.serial = function (steps, callback) {
    (_(steps).reduceRight(_.wrap, callback))();
};

Bones.utils.form = function(form, model, options) {
    var parseOptions = function (o) {
        return _(o.match(/([\d\w-]*)\=(\"[^\"]*\"|[^\s]*)/g)).reduce(function(memo,pair) {
            pair = pair.replace(/"|'/g, '').split('=');
            memo[pair[0]] = pair[1];
            return memo;
        }, {});
    };
    var attr = _($('input[name],textarea[name],select[name],.slider',form)).reduce(function(memo, el) {
        el = $(el);
        if (el.hasClass('slider')) return model.deepSet(
            el.data('key'),
            el.hasClass('range') ? el.slider('values') : el.slider('value'),
            { memo:memo });
        if (el.attr('type') === 'checkbox') return model.deepSet(
            el.attr('name'),
            el.is(':checked'),
            { memo:memo });
        return model.deepSet(
            el.attr('name'),
            el.hasClass('parsable') ? parseOptions(el.val()) : el.val(),
            { memo:memo });
    }, {});
    return attr;
};

Bones.utils.sliders = function(el, model, options) {
    options = options || {};
    var up = function(ev, ui) {
        function num(num) {
            num = num || 0;
            if (num >= 1e6) {
                return (num / 1e6).toFixed(1) + 'm';
            } else if (num >= 1e3) {
                return (num / 1e3).toFixed(1) + 'k';
            } else if (num >= 100) {
                return num.toFixed(0);
            } else {
                return num;
            }
        };
        if ($(ev.target).hasClass('range')) {
            ui.values = ui.values || $(ev.target).slider('values');
            $('.ui-slider-handle:first', ev.target).text(num(ui.values[0]));
            $('.ui-slider-handle:last', ev.target).text(num(ui.values[1]));
        } else {
            ui.value = ui.value || $(ev.target).slider('value');
            $('.ui-slider-handle', ev.target).text(num(ui.value));
        }
    };
    var set = function(ev, ui) {
        up(ev, ui);
        var key = $(ev.target).data('key');
        var val = $(ev.target).hasClass('range')
            ? $(ev.target).slider('values')
            : $(ev.target).slider('value');
        model.deepSet(key, val);
    };
    $(el).each(function() {
        $(this).slider(_({
            min:$(this).data('min') || 0,
            max:$(this).data('max') || 0,
            step:$(this).data('step') || 1,
            values: $(this).hasClass('range')
                ? model.deepGet($(this).data('key')) || [
                    $(this).data('min') || 0,
                    $(this).data('max') || 0 ]
                : undefined,
            value: !$(this).hasClass('range')
                ? model.deepGet($(this).data('key')) || 0
                : undefined,
            range: $(this).hasClass('range') ? true : 'min',
            change: set,
            create: up,
            slide: up
        }).extend(options));
    });
};

view = Backbone.View.extend();

view.prototype.events = {
    'click .bleed a': 'unload',
    'click #popup a[href=#close], #popup input.cancel': 'popupClose',
    'click a.popup': 'popupOpen',
    'click #drawer a[href=#close]': 'drawerClose',
    'click a.drawer': 'drawerOpen',
    'click .button.dropdown': 'dropdown',
    'click .toggler a': 'toggler',
    'click a.restart': 'restart',
    'keydown': 'keydown'
};

view.prototype.initialize = function() {
    _(this).bindAll(
        'unload',
        'popupOpen',
        'popupClose',
        'drawerOpen',
        'drawerClose',
        'toggler',
        'keydown',
        'dropdown'
    );
};

view.prototype.unload = function() {
    return !window.onbeforeunload || window.onbeforeunload() !== false;
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
    this.$('#popup')
        .removeClass('active')
        .html(templates.Pane());
    return false;
};

view.prototype.drawerOpen = function(ev) {
    var target = $(ev.currentTarget);

    // Close drawers when the target is active.
    if (target.is('.active')) return this.drawerClose();

    var title = target.text() || target.attr('title');
    this.$('a.drawer.active').removeClass('active');
    target.addClass('active');
    this.$('#drawer')[target.hasClass('mini') ? 'addClass' : 'removeClass']('mini');
    this.$('#drawer').addClass('active')
    this.$('#drawer > .title').text(title);
    return false;
};

view.prototype.drawerClose = function(ev) {
    this.$('a.drawer.active').removeClass('active');
    this.$('#drawer')
        .removeClass('active')
        .html(templates.Pane());
    return false;
};

view.prototype.toggler = function(ev) {
    var link = $(ev.currentTarget);
    var parent = link.parents('.toggler');
    var target = link.attr('href').split('#').pop();
    var targetSelector = '.' + target;
    // mapnik-reference comes with a "*" simbolizer which ends in
    // a "section-*" class name, but "*" is a metacharacter for jQuery
    targetSelector = targetSelector.replace('*', '\\*');
    if (link.hasClass('disabled')) return false;

    $('a', parent).removeClass('active');
    this.$(targetSelector).siblings('.active').removeClass('active');

    link.addClass('active');
    this.$(targetSelector).addClass('active');
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
        target.children('.menu').bind('click', collapse);
    }
    function collapse(ev) {
        target.removeClass('active');
        $(app).unbind('click', collapse);
        target.children('.menu').bind('click', collapse);
    }
};

view.prototype.restart = function(ev) {
    var target = $(ev.currentTarget);
    var parent = target.parents('.restartable');
    if (parent.hasClass('restarting')) return false;

    target.addClass('active');
    parent.addClass('restarting');
    $.ajax({
        url: 'http://'+window.abilities.tileUrl+'/restart',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({'bones.token':Backbone.csrf('/restart')}),
        dataType: 'json',
        processData: false,
        success: function() {
            Bones.utils.until('http://'+window.abilities.tileUrl+'/status', function() {
                target.removeClass('active');
                parent
                    .removeClass('loading')
                    .removeClass('restarting')
                    .removeClass('restartable');
                if (parent.is('#drawer')) $('a[href=#close]',parent).click();
            });
        },
        error: function(err) {
            target.removeClass('active');
            parent
                .removeClass('loading')
                .removeClass('restarting')
                .removeClass('restartable');
            if (parent.is('#drawer')) $('a[href=#close]',parent).click();
            new views.Modal(err);
        }
    });
    return false;
};

