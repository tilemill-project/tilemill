view = Backbone.View.extend();

view.prototype.events = {
    'click a.delete': 'exportDelete',
    'click a.preview': 'exportPreview',
    'click a.load': 'loadExport'
};

view.prototype.initialize = function(options) {
    if (!options.project) throw new Error('No project model provided.');
    this.project = options.project;
    //_(this).bindAll('render', 'exportDelete', 'exportPreview', 'loadExport', 'poll');
    _(this).bindAll('render', 'poll', 'exportDelete', 'exportPreview', 'loadExport');
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

// Load the export properties back into the Export dialog, to process again
view.prototype.loadExport = function(ev) {
    $('.project').addClass('meta');
    // Get selected export ID, then get selected export model
    var id = $(ev.currentTarget).attr('href').split('#load-').pop();
    var selExport = this.collection.get(id);
    var format = selExport.get('format');

    // Create new view for Export dialog
    new views.Metadata({
        el: $('#meta'),
        type: (format === 'sync' || format === 'mbtiles') ? 'tiles' : 'image',
        // Create new Export model, and copy over settings from selected export
        model: new models.Export({
            id: undefined,  //create new export
            format: format,
            project: selExport.get('project'),
            filename: selExport.get('filename'),
            bbox: selExport.get('bbox'),
            width: selExport.get('width'),
            height: selExport.get('height'),
            zooms: selExport.get('zooms'),
            center: selExport.get('center'),
            metatile: selExport.get('metatile'),
            static_zoom: selExport.get('static_zoom')
        }),
        project: this.project,
        title: $(ev.currentTarget).attr('title'),
        // After user selects Export from Export dialog, then...
        success: _(function() {
            $('#meta').empty();
            $('.project').removeClass('meta');
            if (!$('#drawer').is('.active')) {
                $('a[href=#exports]').click();
            }
            // Call exportList() to display lists of exports
            this.exportList();
        }).bind(this),
        cancel: _(function() {
            $('#meta').empty();
            $('.project').removeClass('meta');
        }).bind(this)
    });
    return false;
};

// Create a global reference to the exports collection on the Bones
// object. Ensures that export polling only ever occurs against one
// collection.
view.prototype.exportList = function(model) {
    $('#drawer').addClass('loading');
    var projectModel = this.project;
    Bones.models = Bones.models || {};
    Bones.models.exports = Bones.models.exports || new models.Exports();
    Bones.models.exports.fetch({
        success: function(collection) {
            $('#drawer').removeClass('loading');
            new views.Exports({
                collection: collection,
                project: projectModel,
                el: $('#drawer')
            });
        },
        error: function(m, e) {
            $('#drawer').removeClass('loading');
            new views.Modal(e);
        }
    });
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
