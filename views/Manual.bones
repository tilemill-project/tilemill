view = Backbone.View.extend();

view.prototype.initialize = function() {
    _(this).bindAll('render');
    this.render();
}

view.prototype.render = function() {
    $(this.el).html(templates.Manual(this.model));
    this.$('.md').each(function() {
        var html = $('<div></div>')
            .html((new Showdown.converter()).makeHtml($(this).html()))
            .attr('class', $(this).attr('class'))
            .attr('id', $(this).attr('id'));
        $(this).hide().after(html);
        $('h1, h2, h3, h4, h5, h6', html).each(function() {
            var heading = this;
            var cleaned = $(heading).text().replace(/[\s\W]+/g, '-').toLowerCase();
            $(this).attr('id', cleaned);
            this.className = this.nodeName;

            if (!$(this).is('h1')) {
                $('.navigation ul').append(
                    $('<li></li>')
                        .addClass(heading.nodeName)
                        .append($('<a></a>')
                            .text($(heading).text())
                            .attr('href', '#')
                            .click(function() {
                                window.scroll(0, $(heading).offset().top - 60);
                                console.log($(heading).offset().top);
                                return false;
                            })
                    )
                );
            }

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
