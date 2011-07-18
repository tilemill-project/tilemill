view = Backbone.View.extend();

view.prototype.events = {
    'click a.delete': 'exportDelete'
};

view.prototype.initialize = function(options) {
    Bones.intervals = Bones.intervals || {};
    Bones.intervals.exports = Bones.intervals.exports ||
        setInterval(_(this.collection.fetch).bind(this.collection), 5000);

    _(this).bindAll('render', 'exportDelete');
    this.collection.bind('all', this.render);
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
            model.destroy({ error: function(m, e) { new views.Modal(e) }});
        }
    });
    return false;
};
