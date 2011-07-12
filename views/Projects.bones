view = Backbone.View.extend({
    events: {
        'click input.submit': 'add',
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
        var id = this.$('input.text').val();
        var model = new models.Project({}, {collection:this.collection});
        var error = _(function(model, err) {
            $(this.el).removeClass('loading');
            new views.Modal(err);
        }).bind(this);
        $(this.el).addClass('loading');
        if (model.set({id:id}, {error:error})) {
            model.setDefaults();
            model.save(model, {
                success: _(function() {
                    $(this.el).removeClass('loading');
                    this.collection.add(model);
                }).bind(this),
                error: error
            });
        }
        return false;
    },
    del: function(ev) {
        var id = $(ev.currentTarget).attr('id');
        var model = this.collection.get(id);
        new views.Modal({
            content: _('Are you sure you want to delete "<%=id%>?"').template({id:id}),
            callback: _(function() {
                model.destroy({
                    success: function() {
                        this.collection.remove(model);
                    }.bind(this),
                    error: function(model, err) {
                        new views.Modal(err);
                    }.bind(this)
                });
            }).bind(this)
        });
        return false;
    }
});
