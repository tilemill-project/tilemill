view = Backbone.View.extend({
    events: {
        'click .actions a[href=#add]': 'add',
        'click .actions a[href=#config]': 'config',
        'click .delete': 'del'
    },
    initialize: function() {
        _(this).bindAll('render', 'add', 'del');
        this.collection.bind('add', this.render);
        this.collection.bind('remove', this.render);
        this.render();
    },
    render: function() {
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
            content: _('Are you sure you want to delete "<%=id%>?"').template({id:id}),
            callback: _(function() {
                model.destroy({
                    success: _(function() {
                        this.collection.remove(model);
                    }).bind(this),
                    error: _(function(model, err) {
                        new views.Modal(err);
                    }).bind(this)
                });
            }).bind(this),
            affirmative: 'Delete'
        });
        return false;
    },
    config: function() {
        (new models.Config).fetch({
            success: function(model, resp) {
                new views.Config({ el: $('#popup'), model: model });
            },
            error: function(model, err) {
                new views.Modal(err);
            }
        });
    }
});
