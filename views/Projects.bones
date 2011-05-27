view = Backbone.View.extend({
    events: {
        'click input.submit': 'add',
        'click .delete': 'del'
    },
    initialize: function() {
        _.bindAll(this, 'render', 'add', 'del', 'error');
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
        var message = 'Are you sure you want to delete ' + id + '?';
        $(this.el).addClass('loading');
        if (model && confirm(message)) {
            model.destroy({
                success: function() {
                    $(this.el).removeClass('loading');
                    this.collection.remove(model);
                }.bind(this),
                error: function(model, err) {
                    $(this.el).removeClass('loading');
                    this.error(err);
                }.bind(this)
            });
        } else {
            $(this.el).removeClass('loading');
        }
        return false;
    },
    error: function(err) {
    }
});
