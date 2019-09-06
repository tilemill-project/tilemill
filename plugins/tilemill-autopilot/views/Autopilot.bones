view = views.Layers.extend({});

view.prototype.events = _({
    'click .aspects a': 'aspect',
    'click a[href=#custom]': 'custom',
    'click a[href=#disable]': 'disable'
}).extend(view.prototype.events);

view.prototype.initialize = _(view.prototype.initialize).wrap(function(p, o) {
    if (!o.charts) throw new Error('options.charts is required');
    if (!o.editor) throw new Error('options.editor is required');

    _(this).bindAll('compile', 'aspect', 'custom', 'disable');
    $(this.el).parents('div.project').addClass('autopilot');
    this.editor = o.editor;
    this.charts = o.charts;
    this.charts.bind('change', this.compile);
    this.model.get('Layer').bind('change', this.compile);
    this.compile();
    return p.call(this);
});

view.prototype.compile = function(opts) {
    opts = opts || {};
    var autopilot = this.model.get('Stylesheet').get('autopilot.mss');
    if (autopilot) autopilot.set({
        data: templates.AutopilotCompile({
            disable: opts.disable,
            layer: this.model.get('Layer'),
            charts: this.charts
        })
    });
};

view.prototype.custom = function(ev) {
    var target = $(ev.currentTarget);
    var parent = $(this.el).parents('div.project');
    target.toggleClass('active');
    $('.editor', parent).toggleClass('active');
    this.editor.render();
    return false;
};

view.prototype.disable = function(ev) {
    new views.Modal({
        content: 'Disable autopilot for this project? This action cannot be undone.',
        affirmative: 'Disable',
        callback: _(function() {
            this.compile({disable:true});
            $(this.el).parents('div.project').removeClass('autopilot');
            this.editor.render();
            this.remove();
        }).bind(this)
    });
    return false;
};

view.prototype.aspect = function(ev) {
    var id = $(ev.currentTarget).attr('href').split('#').pop();
    var type = $(ev.currentTarget).attr('class').split('-').pop().split(' ').shift();
    var chart = this.charts.get(id);
    var editor = $('.aspect', $(ev.currentTarget).parents('li'));

    this.$('.aspect').attr('class', 'aspect');
    this.$('.aspects a.active').removeClass('active');
    if (this.aspectView) this.aspectView.remove();

    // Target aspect is currently active one. Toggle off.
    if (this.aspectView &&
        this.aspectView.model === chart &&
        this.aspectView.type === type) {
        delete this.aspectView;
        return false;
    }

    var el = $('<div></div>');
    editor.addClass('active').addClass('aspect-' + type).html(el);
    $(ev.currentTarget).addClass('active');
    this.aspectView = new views.Aspect({
        el: el,
        type: type,
        model: chart,
        project: this.model,
        target: ev.currentTarget
    });
    return false;
};

view.prototype.render = function() {
    $(this.el).html(templates.Autopilot());
    this.makeLayer(new models.Layer({ id:'Map', geometry:'map' }));
    this.model.get('Layer').chain().each(this.makeLayer);
    this.$('ul.layers').sortable({
        axis: 'y',
        handle: '.handle',
        containment: this.$('ul.layers'),
        tolerance: 'pointer',
        items: '> *:not(.pinned)'
    });
};

view.prototype.makeLayer = function(model) {
    model.chart = this.charts.get(model.id) || new models.Chart({id:model.id});
    model.el = $(templates.AutopilotLayer(model));

    // Add chart if not part of collection.
    if (!this.charts.get(model.id)) this.charts.add(model.chart);

    // Prepend layers since intuitively the last drawn layer appears
    // "on top" of the other layers (painting model).
    this.$('ul.layers').prepend(model.el);

    // Bind to the 'remove' event to teardown
    model.bind('remove', function() {
        model.el.remove();
    });
    // Bind change event to retemplate.
    model.bind('change', function() {
        var update = $(templates.AutopilotLayer(model));
        model.el.replaceWith(update);
        model.el = update;
    });
    // Bind chart change event to redrawing aspects.
    model.chart.bind('change', function() {
        var update = $(templates.AutopilotLayer(model));
        var type = $('.aspects a.active').attr('class').split('aspect-').pop().split(' ').shift();
        $('.aspects', model.el).replaceWith($('.aspects', update));
        $('.aspects a.aspect-'+type, model.el).addClass('active');
    });
};

views['Stylesheets'].augment({
    initialize: function(p) {
        p.call(this);

        var autopilot = this.model.get('Stylesheet').get('autopilot.mss');
        if (!autopilot) return;

        var lines = autopilot.get('data').split('\n');
        if (lines.length < 4) return;

        var header = lines[1].match(/^autopilot (\d\.\d\.\d)$/);
        if (!header) return;

        var data = [];
        try { data = JSON.parse(lines[2]); } catch(e) {};

        // Autopilot on!
        var el = $('<div class="autopilot fill-s"></div>');
        $(this.el).after(el);
        new view({
            editor: this,
            charts: new models.Charts(data),
            model: this.model,
            el: $(el)
        });
        return;
    }
});

views['Layer'].augment({ render: function(p) {
    p.call(this);
    if ($('.project.autopilot').size()) $('#popup div.layer').addClass('autopilot');
    return this;
}});

