view = Backbone.View.extend();

view.prototype.initialize = function(options) {
    _(this).bindAll('render');
    this.render();
};

view.prototype.render = function() {
    $('.bleed .active').removeClass('active');
    $('.bleed .manual').addClass('active');

    $(this.el).html(templates.Manual({model: this.model, collection: this.collection}));
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
        });
        $('a', html).each(function() { $(this).get(0).target = '_blank'; });
    });
};

