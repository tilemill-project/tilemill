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
        var model = new this.collection.model();
        $(this.el).addClass('loading');
        if (this.collection.get(id)) {
            $(this.el).removeClass('loading');
            this.error(new Error('Project names must be unique.'));
            this.$('input.text').val('');
        } else if (model.set({id:id}, {error: this.error})) {
            model.setDefaults();
            model.save(model, {
                success: function() {
                    $(this.el).removeClass('loading');
                    this.collection.add(model);
                    // window.app.done();
                }.bind(this),
                error: function(model, err) {
                    $(this.el).removeClass('loading');
                    this.error(err);
                }.bind(this)
            });
        }
        return false;
    },
    del: function(ev) {
        var id = $(ev.currentTarget).attr('id');
        var model = this.collection.get(id);
        new views.Modal({
            content: _('Are you sure you want to delete "<%=id%>?"').template({id:id}),
            callback: _(function(confirm) {
                confirm && model.destroy({
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
