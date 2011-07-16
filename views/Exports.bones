view = Backbone.View.extend();

view.prototype.events = {
    'click a.delete': 'exportDelete'
};

view.prototype.initialize = function(options) {
    _(this).bindAll('render', 'exportDelete');
    this.render();
};

view.prototype.render = function() {
    this.$('.content').html(templates.Exports(this.collection));
    return this;
};

view.prototype.exportDelete = function(ev) {
    var id = $(ev.currentTarget).attr('href').split('#').pop();
    var model = this.collection.get(id);
    new views.Modal({
        content: 'Are you sure you want to delete "'+ model.get('filename') +'"?',
        callback: function() {
            model.destroy({
                success: function() { $('#export-' + id).remove(); },
                error: function(m, e) { new views.Modal(e) }
            });
        }
    });
    return false;
};
