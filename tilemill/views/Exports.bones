view = Backbone.View.extend();

view.prototype.events = {
    'click a.delete': 'exportDelete',
    'click a.preview': 'exportPreview'
};

view.prototype.initialize = function(options) {
    _(this).bindAll('render', 'exportDelete', 'exportPreview', 'poll');
    this.collection.bind('all', this.render);
    this.collection.bind('all', this.poll);
    this.render(true).poll();
};

view.prototype.render = function(force) {
    if (force === true || this.$('ul.exports').size()) {
        this.$('.content').html(templates.Exports(this));
    }
    return this;
};

view.prototype.time = function(ms) {
    function lpad(str, len, chr) {
        if (!chr) chr = ' ';
        str = String(str);
        len = Math.max(0, len - str.length + 1);
        return Array(len).join(chr) + str;
    }
    var seconds = ms / 1000 | 0;
    var hours = (seconds / 3600) | 0;
    if (hours > 48) return Math.round(hours/24) + ' days';

    seconds -= hours * 3600;
    var minutes = (seconds / 60) | 0;
    seconds -= minutes * 60;
    return lpad(hours, 2, '0') + ':' + lpad(minutes, 2, '0') + ':' + lpad(seconds, 2, '0') + 's';
};

view.prototype.exportDelete = function(ev) {
    var id = $(ev.currentTarget).attr('href').split('#').pop();
    var model = this.collection.get(id);
    var name = model.get('name') || model.get('filename');
    new views.Modal({
        content: 'Are you sure you want to delete "'+name+'"?',
        callback: function() {
            model.destroy({ error: function(m, e) { new views.Modal(e) }});
        },
        affirmative: 'Delete'
    });
    return false;
};

view.prototype.exportPreview = function(ev) {
    var id = $(ev.currentTarget).attr('href').split('#').pop();
    var model = this.collection.get(id);
    new views.Preview({
        el: $('#popup'),
        model:model,
        collection: this.collection
    });
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
        Bones.intervals.exports = setInterval(_(function() {
            this.collection.fetch({
                success: function() {},
                error: function(m, err) {
                    new views.Modal(err);
                    clearInterval(Bones.intervals.exports);
                }
            });
        }).bind(this), 5000);
    } else if (!active && Bones.intervals.exports) {
        clearInterval(Bones.intervals.exports);
        Bones.intervals.exports = null;
    }
};
