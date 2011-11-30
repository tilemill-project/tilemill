view = Backbone.View.extend();

view.prototype.initialize = function(options) {
    this.render();
};

view.prototype.render = function() {
    if (this.$('.manual').size()) return this;

    this.$('.content').html(templates.Reference(abilities.carto));
    this.$('pre.carto-snippet').each(function(i, elem) {
        CodeMirror(
            function(el) { $(elem).replaceWith(el); },
            {
                readOnly: 'nocursor',
                mode: {name:'carto', reference:abilities.carto},
                value: $(elem).text()
            }
        );
    });
    return this;
};

