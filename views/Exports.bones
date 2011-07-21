view = Backbone.View.extend();

view.prototype.events = {
    'click a.delete': 'exportDelete'
};

view.prototype.initialize = function(options) {
    _(this).bindAll('render', 'exportDelete', 'poll');
    this.collection.bind('all', this.render);
    this.collection.bind('all', this.poll);
    this.render(true).poll();
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

// Poll controller.
// - Starts polling if exports are active and drawer shows this view.
// - Stops polling under all other conditions.
view.prototype.poll = function() {
    Bones.intervals = Bones.intervals || {};

    var active =
        this.collection.any(function(m) {
            return _(['waiting','processing']).include(m.get('status'))
        })
        && $('#drawer').is('.active')
        && this.$('ul.exports').size();

    if (active && !Bones.intervals.exports) {
        var fetch = _(this.collection.fetch).bind(this.collection);
        Bones.intervals.exports = setInterval(fetch, 5000);
    } else if (!active && Bones.intervals.exports) {
        clearInterval(Bones.intervals.exports);
        Bones.intervals.exports = null;
    }
};
