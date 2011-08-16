view = Backbone.View.extend();

view.prototype.events = {
    'click .navigation a': 'jump'
};

view.prototype.initialize = function(options) {
    _(this).bindAll('render', 'jump');
    this.render();
    this.jump(options.fragment);
};

view.prototype.render = function() {
    $(this.el).html(templates.Manual(this.model));
    this.$('.md').each(function() {
        var html = $('<div></div>')
            .html((new Showdown.converter()).makeHtml($(this).html()))
            .attr('class', $(this).attr('class'))
            .attr('id', $(this).attr('id'));
        $(this).hide().after(html);
        $('h2, h3, h4, h5, h6', html).each(function() {
            var heading = this;
            var cleaned = $(heading).text().replace(/[\s\W]+/g, '-').toLowerCase();
            $(this).attr('id', 'manual-' + cleaned);
            this.className = this.nodeName;

            $('.navigation ul').append(
                $('<li></li>')
                    .addClass(heading.nodeName)
                    .append($('<a></a>')
                        .text($(heading).text())
                        .attr('href', '#!/manual/' + cleaned)
                )
            );
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
};

view.prototype.jump = function(ev) {
    var fragment;
    if (ev && ev.currentTarget) {
        fragment = $(ev.currentTarget).attr('href').split('#!/manual/').pop();
    } else {
        fragment = ev;
    }
    if (fragment) {
        window.scroll(0, this.$('#manual-' + fragment).offset().top - 60);
        Backbone.history.saveLocation('/manual/' + fragment);
    } else {
        window.scroll(0, 0);
        Backbone.history.saveLocation('/manual');
    }
    return false;
};

