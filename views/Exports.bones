view = Backbone.View.extend();

view.prototype.events = {
    'click a.delete': 'exportDelete'
};

view.prototype.initialize = function(options) {
    Bones.intervals = Bones.intervals || {};
    Bones.intervals.exports = Bones.intervals.exports ||
        setInterval(_(this.collection.fetch).bind(this.collection), 5000);

    _(this).bindAll('render', 'exportDelete', 'stop');
    this.collection.bind('all', this.render, this.stop);
    this.collection.bind('all', this.stop);
    this.render(true);
};

view.prototype.render = function(force) {
    if (force === true || this.$('ul.exports').size()) {
        this.$('.content').html(templates.Exports(this.collection));
    }
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

view.prototype.stop = function(ev) {
    // Stop polling if drawer has be replaced with other content.
    if (!this.$('.content ul.exports').size()) {
        clearInterval(Bones.intervals.exports);
        Bones.intervals.exports = null;
    }
}
