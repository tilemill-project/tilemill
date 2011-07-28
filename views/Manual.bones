view = Backbone.View.extend();

view.prototype.initialize = function() {
    _(this).bindAll('render');
    this.render();
}

view.prototype.render = function() {
    $(this.el).html(templates.Manual());
    this.$('.md').each(function() {
        var html = $('<div></div>')
            .html((new Showdown.converter()).makeHtml($(this).html()))
            .attr('class', $(this).attr('class'))
            .attr('id', $(this).attr('id'));
        $(this).hide().after(html);
        $('h1, h2, h3, h4, h5, h6', html).each(function() {
            var cleaned = $(this).text().replace(/[\s\W]+/g, '-').toLowerCase();
            $(this).attr('id', cleaned);
        });
    });
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
}
