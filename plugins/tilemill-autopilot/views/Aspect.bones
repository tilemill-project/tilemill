view = Backbone.View.extend();

view.prototype.events = {
    'change select': 'select',
    'click a': 'link'
};

//view.prototype.css2rgb = views.Stylesheets.prototype.css2rgb;
view.prototype.css2rgb = function(c) {
    var x = function(i, size) {
        return Math.round(parseInt(c.substr(i, size), 16)
            / (Math.pow(16, size) - 1) * 255);
    };
    if (c[0] === '#' && c.length == 7) {
        return {R:x(1, 2), G:x(3, 2), B:x(5, 2)};
    } else if (c[0] === '#' && c.length == 4) {
        return {R:x(1, 1), G:x(2, 1), B:x(3, 1)};
    } else {
        var rgb = c.match(/\d+/g);
        return {R:rgb[0], G:rgb[1], B:rgb[2]};
    }
};

view.prototype.initialize = function(options) {
    _(this).bindAll(
        'render',
        'select',
        'link',
        'swatches');
    if (!options.type) throw new Error('options.type required');
    if (!options.target) throw new Error('options.target required');
    if (!options.project) throw new Error('options.project required');

    this.type = options.type;
    this.target = options.target;
    this.project = options.project;
    this.datasource = new models.Datasource();

    // Skip datasource load for Map.
    if (this.model.id === 'Map') return this.render();

    // Bind model change handlers.
    this.model.bind('change:polygon-fill', this.swatches);
    this.model.bind('change:marker-fill', this.swatches);
    this.model.bind('change:text-fill', this.swatches);
    this.model.bind('change:_polygon-field', this.render);
    this.model.bind('change:_marker-field', this.render);
    this.model.bind('filters', this.render);

    // Load datasource.
    var layer = this.project.get('Layer').get(this.model.id);
    this.datasource.set(_(layer.get('Datasource')).extend({
        id: layer.id,
        project: this.project.id,
        srs: layer.get('srs')
    }));
    this.datasource.fetchInfo({
        success: _(function(m, resp) {
            // Hack zoom 'field' in.
            m.attributes.fields['zoom'] = {type:'Number', min:0, max:22};
            this.render();
        }).bind(this),
        error: function(m, err) { new views.Modal(err) }
    });
};

view.prototype.render = function() {
    $(this.el).html(templates['Aspect'+this.type](this));
    var model = this.model;

    var colorpicker = this.$('.colorpicker');
    var val = this.model.deepGet(colorpicker.data('key')) || '#fff';
    var hsv = Color.RGB_HSV(this.css2rgb(val));
    var loading = true;
    new Color.Picker({
        hue: hsv.H,
        sat: hsv.S,
        val: hsv.V,
        element: colorpicker.get(0),
        callback: function(hex) {
            if (loading) return;
            model.deepSet(colorpicker.data('key'), '#' + hex);
        }
    });
    loading = false;

    this.$('select').each(function() {
        $(this).val(model.deepGet($(this).attr('name')));
    });

    Bones.utils.sliders(this.$('.slider'), model);
    return this;
};

view.prototype.link = function(ev) {
    var method = $(ev.currentTarget).attr('href').split('#').pop();
    if (this[method]) return this[method](ev);
};

view.prototype.select = function(ev) {
    var key = $(ev.currentTarget).attr('name');
    if (!key) return;

    var attr = {};
    attr[key] = $(ev.currentTarget).val();
    this.model.set(attr);
};

view.prototype.shadeAdd = function(ev) {
    var key = $(ev.currentTarget).data('key');
    var shades = _(this.model.get(key)).isString()
        ? [this.model.get(key)]
        : this.model.get(key) || [];
    if (shades.length > 10) return false;
    shades.push(_(shades).last());
    this.model.deepSet(key, shades);
    return false;
};

view.prototype.shadeRemove = function(ev) {
    var key = $(ev.currentTarget).data('key');
    var shades = _(this.model.get(key)).isString()
        ? [this.model.get(key)]
        : this.model.get(key) || [];
    if (shades.length < 2) return false;
    shades.pop();
    this.model.deepSet(key, shades);
    return false;
};

view.prototype.shadeFlip = function(ev) {
    var key = $(ev.currentTarget).data('key');
    var shades = _(this.model.get(key)).isString()
        ? [this.model.get(key)]
        : this.model.get(key) || [];
    shades.reverse();
    this.model.deepSet(key, shades);
    return false;
};

view.prototype.shadeInterpolate = function(ev) {
    var key = $(ev.currentTarget).data('key');
    var shades = _(this.model.get(key)).isString()
        ? [this.model.get(key)]
        : this.model.get(key) || [];
    if (shades.length < 3) return false;
    var divisor = shades.length - 1;
    var start = this.css2rgb(_(shades).first());
    var end = this.css2rgb(_(shades).last());
    var diff = {
        R:(end.R-start.R)/divisor | 0,
        G:(end.G-start.G)/divisor | 0,
        B:(end.B-start.B)/divisor | 0
    };
    var hex = function(val) {
        val = (val > 255 ? 255 : val).toString(16);
        while (val.length < 2) { val = '0' + val; }
        return val;
    };
    this.model.deepSet(key, _(shades).map(function(val, i) {
        if (i === 0) return val;
        if (i === shades.length - 1) return val;
        return ['#',
            hex(start.R + (diff.R*i)),
            hex(start.G + (diff.G*i)),
            hex(start.B + (diff.B*i))].join('');
    }));
    return false;
};

view.prototype.swatches = function() {
    var index = this.$('.swatches a').index(this.$('.swatches a.active'));
    this.$('.swatches')
        .replaceWith($('.swatches', templates['Aspect'+this.type](this)));
    this.$('.swatches a:eq('+index+')').addClass('active');
};

view.prototype.swatch = function(ev) {
    var target = $(ev.currentTarget);
    this.$('.colorpicker').data('key', target.data('key'));
    this.$('a.swatch.active').removeClass('active');
    target.addClass('active');
    return false;
};

view.prototype.filterAdd = function(ev) {
    var field = this.$('.tools select').val();
    var info = this.datasource.get('fields')[field];
    if (!field || !info) return false;

    var key = this.$('.tools select').data('key') +'.'+ field;
    var filter = this.model.deepGet(key) || [info.min||0, info.max||0];
    this.model.deepSet(key, filter);
    this.model.trigger('filters');
    return false;
};

view.prototype.filterRemove = function(ev) {
    var key = $(ev.currentTarget).data('key').split('.').shift();
    var filter = $(ev.currentTarget).data('key').split('.').pop();
    var filters = _(this.model.get(key) || {}).clone();
    delete filters[filter];
    this.model.deepSet(key, filters);
    this.model.trigger('filters');
    return false;
};

view.prototype.macroAdd = function(ev) {
    var field = this.$('.tools select').val();
    var info = this.datasource.get('fields')[field];
    if (!field || !info) return false;

    var key = $(ev.currentTarget).data('key');
    var keyField = '_'+this.type+'-'+key+'.field';
    var keyRange = '_'+this.type+'-'+key+'.range';
    this.model.deepSet(keyField, field);
    this.model.deepSet(keyRange, this.model.deepGet(keyRange) || [info.min||0, info.max||0]);
    this.model.trigger('filters');
    return false;
};

view.prototype.macroRemove = function(ev) {
    var key = $(ev.currentTarget).data('key');
    this.model.unset(key);
    this.model.trigger('filters');
    return false;
};

