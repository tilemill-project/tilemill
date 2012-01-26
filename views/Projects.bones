view = Backbone.View.extend({
    events: {
        'click a[href=#add]': 'add',
        'click .delete': 'del'
    },
    initialize: function() {
        _(this).bindAll('render', 'add', 'del');
        this.collection.bind('add', this.render);
        this.collection.bind('remove', this.render);
        this.render();
    },
    render: function() {
        $('.bleed .active').removeClass('active');
        $('.bleed .projects').addClass('active');

        $(this.el).html(templates.Projects(this.collection));
        return this;
    },
    add: function() {
        var model = new models.Project({}, {collection:this.collection});
        new views.ProjectAdd({ el: $('#popup'), model: model });
    },
    del: function(ev) {
        var id = $(ev.currentTarget).attr('id');
        var model = this.collection.get(id);
        new views.Modal({
            content: _('Are you sure you want to delete "<%=get("name")||id%>?"').template(model),
            callback: _(function() {
                model.destroy({
                    success: _(function() {
                        this.collection.remove(model);
                        // Reset the project nav item to be disabled if
                        // set to the project that is being deleted.
                        if ($('.bleed .editor').attr('href') === '#/project/' + model.id)
                            $('.bleed .editor')
                                .removeAttr('href')
                                .addClass('disabled');
                    }).bind(this),
                    error: _(function(model, err) {
                        new views.Modal(err);
                    }).bind(this)
                });
            }).bind(this),
            affirmative: 'Delete'
        });
        return false;
    }
});
