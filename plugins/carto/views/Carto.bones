view = Backbone.View.extend();

view.prototype.events = {
    'click .toggler a': 'toggler'
}

view.prototype.initialize = function(options) {
    this.render();
    this._carto_state = options._carto_state;
    if (this._carto_state.section) {
        $('a[href=' + this._carto_state.section + ']').click();
    }
};

view.prototype.toggler = function(ev) {
    this._carto_state.section = $(ev.currentTarget).attr('href');
};

view.prototype.render = function() {
    if (this.$('.manual').size()) return this;

    this.$('.content').html(templates.Reference(abilities.carto));
    this.$('pre.carto-snippet').each(function(i, elem) {
        CodeMirror(function(el) {
            $(elem).replaceWith(el);
        }, {
                readOnly: 'nocursor',
                mode: {
                    name: 'carto',
                    reference: abilities.carto
                },
                value: $(elem).text()
            }
        );
    });
    return this;
};

view.plugin = function(project) {
    $(project.el).delegate('a[href=#carto]', 'click', function(ev) {
        new view({
            el: $('#drawer'),
            _carto_state: project._carto_state
        });
    });
};

// Hook in to projet view with an augment.
views.Project.augment({
    events: { 'click a[href=#carto]': 'carto' },
    carto: function() {
        new view({
            el:$('#drawer'),
            _carto_state: this._carto_state
        })
    },
    initialize: function(p, o) {
        _(this).bindAll('carto');
        return p.call(this, o);
    },
    render: function(p) {
        p.call(this);
        this.$('.palette').prepend("<a class='drawer' href='#carto'><span class='icon reverse reference'>Carto</span></a>");
        return this;
    }
});

