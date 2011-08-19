view = Backbone.View.extend({
    events: {
        'click .actions a[href=#add]': 'add',
        'click .actions a[href=#exports]': 'exportList',
        'click .delete': 'del'
    },
    initialize: function() {
        _(this).bindAll('render', 'add', 'del', 'exportList');
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
            }).bind(this)
        });
        return false;
    },
    exportList: function(ev) {
        $('#popup').addClass('loading');
        Bones.models = Bones.models || {};
        Bones.models.exports = Bones.models.exports || new models.Exports();
        Bones.models.exports.fetch({
            success: function(collection) {
                $('#popup').removeClass('loading');
                new views.Exports({
                    collection: collection,
                    el: $('#popup')
                });
            },
            error: function(m, e) {
                $('#popup').removeClass('loading');
                new views.Modal(e);
            }
        });
    }
});
