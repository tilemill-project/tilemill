view = Backbone.View.extend();

view.prototype.events = {
    'click .links a': 'show'
};

view.prototype.initialize = function(options) {
    this.render();
};

view.prototype.render = function() {
    if (this.$('.manual').size()) return this;

    this.$('.content').html(templates.Reference(cartoReference));
    this.$('pre.carto-snippet').each(function(i, elem) {
        CodeMirror(
            function(el) { $(elem).replaceWith(el); },
            {
                readOnly: 'nocursor',
                mode: {name:'carto', reference:cartoReference},
                value: $(elem).text()
            }
        );
    });
    return this;
};

view.prototype.show = function(ev) {
    var link = $(ev.currentTarget);
    var section = link.attr('href').split('#').pop();
    this.$('.links a.active').removeClass('active');
    this.$('.section.active').removeClass('active');
    link.addClass('active');
    this.$('#' + section).addClass('active');
    return false;
};
