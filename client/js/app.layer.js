var Layer = Backbone.Model.extend({
    // @TODO either as a feature or a bug, object attributes are not set
    // automatically when passed to the constructor. We set it manually here.
    initialize: function(attributes) {
        this.set({'Datasource': attributes.Datasource});
    },
    validate: function(attributes) {
        if (/^[a-z0-9\-_]+$/i.test(attributes.id) === false) {
            return 'ID must contain only letters, numbers, dashes, and underscores.';
        }
        if (attributes['class'] && /^[a-z0-9\-_ ]+$/i.test(attributes['class']) === false) {
            return 'Class must contain only letters, numbers, dashes, and underscores.';
        }
    }
});

var LayerFields = Backbone.Model.extend({
    // @TODO either as a feature or a bug, object attributes are not set
    // automatically when passed to the constructor. We set it manually here.
    initialize: function(attributes, options) {
        this.set({'fields': attributes.fields});
        this.project = options.project;
    },
    url: function() {
        return '/' + this.project.project64({ signed: true }) + '/' + this.id;
    }
});

var LayerList = Backbone.Collection.extend({
    model: Layer,
    initialize: function(models, options) {
        var self = this;
        this.parent = options.parent;
        this.bind('change', function() {
            this.parent.set({ 'Layer': self });
            this.parent.change();
        });
        this.bind('add', function() {
            this.parent.set({ 'Layer': self });
            this.parent.change();
        });
        this.bind('remove', function() {
            this.parent.set({ 'Layer': self });
            this.parent.change();
        });
    },
});

var LayerListView = Backbone.View.extend({
    id: 'layers',
    className: 'view',
    initialize: function(options) {
        _.bindAll(this, 'render');
        this.project = options.project;
        this.collection.bind('add', this.render);
        this.collection.bind('remove', this.render);
        this.render();
    },
    render: function() {
        // Render wrapper if not present.
        if ($(this.el).has('ul').length === 0) {
            $(this.el).html(ich.LayerListView());
            $('ul', this.el).sortable({ axis: 'y', handle: 'div.handle' });
        }

        // Add row view for each layer.
        var that = this;
        this.collection.each(function(layer) {
            if (!layer.view) {
                layer.view = new LayerRowView({
                    project: that.project,
                    model: layer,
                    list: that
                });
                $('ul', that.el).prepend(layer.view.el);
            }
        });
        return this;
    },
    events: {
        'click .add': 'add',
        'sortupdate ul': 'sortUpdate',
    },
    add: function() {
        new LayerPopupView({
            collection: this.collection,
            model: new Layer,
            add: true
        });
        return false;
    },
    sortUpdate: function(e, ui) {
        var rows = this.$('ul li');
        var newCollection = [];
        this.collection.each(function(model) {
            var index = $.inArray(model.view.el, rows);
            newCollection[index] = model;
        });
        this.collection.models = newCollection.reverse();
        this.collection.trigger('change');
    }
});

var LayerRowView = Backbone.View.extend({
    tagName: 'li',
    className: 'clearfix',
    initialize: function (options) {
        _.bindAll(this, 'render', 'edit', 'inspect', 'del');
        this.model.bind('change', this.render);
        this.project = options.project;
        this.list = options.list;
        this.render();
    },
    render: function () {
        var name = [];
        name.push('#' + this.model.get('id'));
        if (this.model.get('class')) {
            name = name.concat(this.model.get('class').split(' '));
        }
        $(this.el).html(ich.LayerRowView({ name: name.join('.') }));
        return this;
    },
    events: {
        'click .delete': 'del',
        'click .inspect': 'inspect',
        'click .edit': 'edit'
    },
    edit: function() {
        new LayerPopupView({
            collection: this.collection,
            model: this.model,
            add: false
        });
        return false;
    },
    inspect: function() {
        new LayerFieldsView({
            model:  new LayerFields(
                { id: this.model.id },
                { project: this.project }
            )
        });
        return false;
    },
    del: function() {
        window.app.loading();
        if (confirm('Are you sure you want to delete this layer?')) {
            // Tipsy adds the tooltips to the document root,
            // so we need to remove these elements, otherwise we
            // are left with a zombie 'delete' tooltip.
            $('.tipsy').remove();

            this.list.collection.remove(this.model);
            this.remove();
            window.app.done();
        }
        else {
            window.app.done();
        }
        return false;
    }
});


/**
 * View: LayerPopupView
 *
 * Popup form for adding a new stylesheet.
 */
var LayerPopupView = PopupView.extend({
    SRS: {
        '900913': '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs',
        'WGS84': '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs'
    },
    events: _.extend(PopupView.prototype.events, {
        'click input.submit': 'submit',
        'click a#expand-datasources': 'datasources',
        'change select#srs-name': 'selectSRS'
    }),
    initialize: function(params) {
        _.bindAll(this, 'render', 'submit', 'datasources', 'getSRSName', 'selectSRS');
        this.model = this.options.model;
        this.options.title = this.options.add ? 'Add layer' : 'Edit layer';

        var object = {
            'id': this.model.id,
            'class': this.model.get('class'),
            'datasource_file': this.model.get('Datasource') ?
                this.model.get('Datasource').file : '',
            'srs': this.model.get('srs')
        };
        object['srs_name_' + this.getSRSName(this.model.get('srs'))] = true;
        this.options.content = ich.LayerPopupView(object, true);
        this.render();
    },
    submit: function() {
        var success = this.model.set(
            {
                'id': $('input#id', this.el).val(),
                'name': $('input#id', this.el).val(),
                'srs': $('input#srs', this.el).val(),
                'class': $('input#class', this.el).val(),
                'Datasource': {
                    'file': $('input#file', this.el).val(),
                    'type': 'shape',
                    'estimate_extent': 'id',
                    'id': $('input#id', this.el).val()
                }
            },
            { 'error': this.showError }
        );
        if (success) {
            if (this.options.add) {
                this.collection.add(this.model);
            }
            this.remove();
        }
        return false;
    },
    datasources: function() {
        if (!this.lists) {
            this.lists = {};
            this.lists.directory = new DatasourceListView({
                collection: new DatasourceListDirectory,
                target: $('input#file', this.el)
            });
            $('.datasources', this.el).append(this.lists.directory.el);
            this.lists.s3 = new DatasourceListView({
                collection: new DatasourceListS3,
                target: $('input#file', this.el)
            });
            $('.datasources', this.el).append(this.lists.s3.el);
        }
        $('.datasources', this.el).toggle();
        return false;
    },
    showError: function(model, error) {
        window.app.message('Error', error);
    },
    getSRSName: function(srs) {
        for (name in this.SRS) {
            if (this.SRS[name] === srs) {
                return name;
            }
        }
        return 'custom';
    },
    selectSRS: function() {
        var name = $('select#srs-name', this.el).val();
        if (name === 'custom') {
            $('.srs', this.el).show();
        }
        else {
            $('input#srs', this.el).val(this.SRS[name]);
            $('.srs', this.el).hide();
        }
    },
});

var LayerFieldsView = Backbone.View.extend({
    id: 'layer-fields',
    className: 'drawer',
    events: {
        'click .close': 'remove',
        'click .showall': 'deferredRender'
    },
    initialize: function (options) {
        _.bindAll(this, 'loading', 'render', 'deferredRender', 'remove');
        var that = this;
        this.loading(function() {
            that.model.fetch({
                'success': that.render,
                'error': that.render
            });
        });
        this.features = [];
        this.deferredFeatures = [];
    },
    loading: function(callback) {
        window.app.el.append($(this.el));
        $(this.el).html(ich.LayerFieldsView({
            id: this.model.id,
            loading: true,
            fields: []
        }));
        $(this.el).animate({left: '0%'}, callback);
    },
    render: function () {
        var object = {
            id: this.model.id,
            loading: false,
            fields: []
        };
        for (var fieldId in this.model.get('fields')) {
            var field = this.model.get('fields')[fieldId];
            field.name = fieldId;
            if (field.type == 'Number') {
                field.numeric = true;
            }
            field.tooltip = ich.LayerFieldsToolTip(field, true);
            object.fields.push(field);
        }
        var max_cells = 1000;
        var features = this.model.get('features');
        for (var i = 0; i < features.length; i++) {
            var feature = features[i];
            var featureArray = [];
            for (var j = 0; j < object.fields.length; j++) {
                var field = object.fields[j].name;
                featureArray.push({
                    value: feature[field] ? feature[field] : '',
                    type: object.fields[j].type
                });
            }
            if (i * object.fields.length <= max_cells) {
                this.features.push({ values: featureArray });
            }
            else {
                this.deferredFeatures.push({ values: featureArray });
            }
        }
        object.rows = ich.LayerFieldsRowsView({features: this.features}, true);
        $(this.el).html(ich.LayerFieldsView(object));
        if (this.deferredFeatures.length) {
            this.$('.drawer-content').append(ich.LayerFieldsViewAllRowsButtonView({deferredCount: this.deferredFeatures.length}));
        }
        return this;
    },
    deferredRender: function() {
        this.$('.drawer-content .showall').remove();
        var rows = ich.LayerFieldsRowsView({features: this.deferredFeatures}, true);
        this.$('table.features tbody').append(rows);
        return false;
    },
    remove: function() {
        $('table', this.el).remove();
        $(this.el).animate( {left: '-50%'}, function() { $(this).remove() });
        return false;
    }
});

