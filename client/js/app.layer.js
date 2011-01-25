/**
 * View: LayerListView
 *
 * List of all layers on a project.
 */
var LayerListView = Backbone.View.extend({
    id: 'layers',
    className: 'view',
    initialize: function(options) {
        _.bindAll(this, 'render', 'sortUpdate');
        this.project = options.project;
        this.collection.bind('add', this.render);
        this.collection.bind('remove', this.render);
        this.render();
    },
    render: function() {
        // Render wrapper if not present.
        if ($(this.el).has('ul').length === 0) {
            $(this.el).html(ich.LayerListView());
            $('ul', this.el).sortable({
                axis: 'y',
                handle: 'div.handle',
                containment: 'parent'
            });
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

        // Refresh sortable to recognize new layers.
        $('ul', this.el).sortable('refresh');
        return this;
    },
    events: {
        'click .add': 'add',
        'sortupdate ul': 'sortUpdate'
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

/**
 * View: LayerRowView
 *
 * Single layer row in a LayerListView.
 */
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
        new DatasourceView({
            model: new Datasource(
                { id: this.model.id, url: this.model.get('Datasource').file },
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
 * Popup form for adding a new layer.
 */
var LayerPopupView = PopupView.extend({
    SRS: {
        '900913': '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs',
        'WGS84': '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs'
    },
    events: _.extend({
        'click input.submit': 'submit',
        'click a#expand-assets': 'assets',
        'change select#srs-name': 'selectSRS'
    }, PopupView.prototype.events),
    initialize: function(params) {
        _.bindAll(this, 'render', 'submit', 'assets', 'getSRSName', 'selectSRS');
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
                    'type': 'shape'
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
    assets: function() {
        if (!this.lists) {
            this.lists = {};
            this.lists.directory = new AssetListView({
                collection: new AssetListDirectory,
                target: $('input#file', this.el)
            });
            $('.assets', this.el).append(this.lists.directory.el);
            this.lists.s3 = new AssetListView({
                collection: new AssetListS3,
                target: $('input#file', this.el)
            });
            $('.assets', this.el).append(this.lists.s3.el);
        }
        $('.assets', this.el).toggle();
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
        return srs ? 'custom' : 'autodetect';
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
    }
});

/**
 * View: LayerDrawerView.
 *
 * Drawer view for inspecting layer fields.
 */
var DatasourceView = DrawerView.extend({
    className: 'drawer',
    events: _.extend({
        'click .showall': 'deferredRender'
    }, DrawerView.prototype.events),
    initialize: function (options) {
        options.title = this.model.id;
        options.content = '';
        DrawerView.prototype.initialize.call(this, options);

        _.bindAll(this, 'deferredRender', 'loadFields');
        var that = this;
        this.bind('render', function() {
            that.model.fetch({
                'success': that.loadFields,
                'error': that.loadFields
            });
        });
        this.features = [];
        this.deferredFeatures = [];
    },
    loadFields: function () {
        var object = { fields: [] };
        for (var fieldId in this.model.get('fields')) {
            var field = this.model.get('fields')[fieldId];
            field.name = fieldId;
            if (field.type == 'Number') {
                field.numeric = true;
            }
            field.tooltip = ich.DatasourceToolTip(field, true);
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
        object.rows = ich.DatasourceRowsView({features: this.features}, true);
        this.$('.drawer-content').html(ich.DatasourceView(object, true));
        if (this.deferredFeatures.length) {
            this.$('.drawer-content').append(ich.DatasourceViewAllRowsButtonView({deferredCount: this.deferredFeatures.length}));
        }
        return this;
    },
    deferredRender: function() {
        this.$('.drawer-content .showall').remove();
        var rows = ich.DatasourceRowsView({features: this.deferredFeatures});
        this.$('table.features tbody').append(rows);
        return false;
    }
});

