view = Backbone.View.extend();

view.prototype.events = {
    'change select[name=format]': 'formatCustom',
    'click input[type=submit]': 'save'
};

view.prototype.initialize = function(options) {
    _(this).bindAll('render', 'save', 'zoom', 'formatCustom');
    this.render();
};

view.prototype.render = function() {
    this.$('.content').html(templates.Settings(this.model));
    this.$('.slider').slider({
        range: true,
        min:0,
        max:22,
        values:[this.model.get('minzoom'), this.model.get('maxzoom')],
        step:1,
        slide: this.zoom
    });

    // Focus name field for unnamed projects.
    if (!this.model.get('name')) this.$('input[type=text]:first').focus();

    // Update state of custom format field.
    this.formatCustom();

    return this;
};

view.prototype.zoom = function(ev, ui) {
    this.$('.minzoom').text(ui.values[0]);
    this.$('.maxzoom').text(ui.values[1]);
};

view.prototype.formatCustom = function(ev) {
    if (this.$('select[name=format]').val() === '') {
        this.$('.dependent').show();
    } else {
        this.$('.dependent').hide();
    }
};

view.prototype.save = function() {
    var attr = _({
        'name':          this.$('input[name=name]').val(),
        'description':   this.$('input[name=description]').val(),
        'attribution':   this.$('input[name=attribution]').val(),
        'version':       this.$('input[name=version]').val(),
        'format':        this.$('select[name=format]').val() ||
                         this.$('input[name=format_custom]').val(),
        'minzoom':       parseInt(this.$('.slider').slider('values', 0)),
        'maxzoom':       parseInt(this.$('.slider').slider('values', 1)),
        'interactivity': this.$('select[name=layer]').val() ?
            {
                'layer': this.$('select[name=layer]').val(),
                'template_teaser': this.$('textarea[name=template_teaser]').val(),
                'template_full': this.$('textarea[name=template_full]').val(),
                'template_location': this.$('input[name=template_location]').val(),
            } :
            false,
        'bounds': [
            parseFloat(this.$('input[name=bounds_0]').val()),
            parseFloat(this.$('input[name=bounds_1]').val()),
            parseFloat(this.$('input[name=bounds_2]').val()),
            parseFloat(this.$('input[name=bounds_3]').val())
        ],
        'center': [
            parseFloat(this.$('input[name=center_0]').val()),
            parseFloat(this.$('input[name=center_1]').val()),
            parseInt(this.$('input[name=center_2]').val())
        ]
    }).reduce(function(memo, val, key) {
        var allowEmpty = ['description', 'attribution'];
        if (val !== '' || _(allowEmpty).include(key)) memo[key] = val;
        return memo;
    }, {});

    var error = function(m, e) { new views.Modal(e); };
    if (!this.model.set(attr, {error:error})) return false;

    this.model.save({}, {
        success: _(function(model) {
            this.$('.close').click();
        }).bind(this),
        error:error
    });
    return false;
};

