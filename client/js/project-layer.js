// LayerListView
// -------------
// List of all layers on a project. Provides UI for adding, editing, deleting,
// and drag-sorting layers.
var LayerListView = Backbone.View.extend({
    id: 'LayerListView',
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
                containment: 'parent',
                tolerance: 'pointer'
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

// LayerRowView
// ------------
// Single layer row in a LayerListView.
var LayerRowView = Backbone.View.extend({
    tagName: 'li',
    className: 'clearfix',
    initialize: function(options) {
        _.bindAll(this, 'render', 'edit', 'inspect', 'del');
        this.model.bind('change', this.render);
        this.project = options.project;
        this.list = options.list;
        this.render();
    },
    render: function() {
        var name = [];
        name.push('#' + this.model.get('id'));
        if (this.model.get('class')) {
            name = name.concat(this.model.get('class').split(' '));
        }
        $(this.el).html(ich.LayerRowView({
            name: name.join('.'),
            geometry: this.model.get('geometry'),
            geometry_raster: this.model.get('geometry') === 'raster'
        }));
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
        if (this.model.get('Datasource').type === 'postgis') {
            var options = _.extend({ds_type: 'postgis'}, this.model.get('Datasource'));
            var datasource = new PostgisDatasource(options);
        } else {
            var datasource = new FileDatasource({
                id: this.model.id,
                url: this.model.get('Datasource').file
            });
        }
        new DatasourceView({
            model: datasource
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
        } else {
            window.app.done();
        }
        return false;
    }
});

// LayerPopupView
// --------------
// Form for adding or editing a layer.
var LayerPopupView = PopupView.extend({
    initialize: function(options) {
        _.bindAll(this, 'submit', 'assets', 'selectSRS');
        this.model = this.options.model;
        this.options.title = this.options.add ? 'Add layer' : 'Edit layer';
        var type = this.model.get('Datasource')
            && this.model.get('Datasource').type == 'postgis' ? 'postgis' : 'file';
        var tabs = [];
        tabs.push({
            id: 'FileLayerForm',
            title: 'File',
            active: type != 'postgis',
            content: new FileLayerForm({ model: this.model, collection: this.collection, popup: this })
        });
        tabs.push({
            id: 'PostgisLayerForm',
            title: 'PostGIS',
            active: type == 'postgis',
            content: new PostgisLayerForm({ model: this.model, collection: this.collection, popup: this })
        });
        this.options.content = new TabsView({ tabs: tabs });
        PopupView.prototype.initialize.call(this, options);
    }
});

// FileLayerForm
// -------------
var FileLayerForm = Backbone.View.extend({
    events: {
        'click input.submit': 'submit',
        'click a.assets': 'assets',
        'change select#srs-name': 'selectSRS'
    },
    initialize: function(options) {
        _.bindAll(this, 'submit', 'assets', 'selectSRS');
        this.model = this.options.model;

        var object = {};
        object['id'] = this.model.id;
        object['class'] = this.model.get('class');
        object['datasource_file'] = this.model.get('Datasource')
            ? this.model.get('Datasource').file
            : '';
        object['srs'] = this.model.get('srs');
        object['srs_name_' + this.model.srsName()] = true;
        $(this.el).html(ich.FileLayerForm(object, true));
    },
    submit: function() {
        var that = this;
        var datasource = new FileDatasource();
        var success = datasource.set({
            id: $('input#id', this.el).val(),
            url: $('input#file', this.el).val()
        }, { error: that.options.popup.showError });
        if (success) {
            this.options.popup.loading('Loading datasource');
            datasource.fetch({
                success: function() {
                    that.options.popup.done();
                    var success = that.model.set(
                        {
                            'id': $('input#id', that.el).val(),
                            'name': $('input#id', that.el).val(),
                            'srs': $('input#srs', that.el).val(),
                            'class': $('input#class', that.el).val(),
                            'Datasource': {
                                'file': $('input#file', that.el).val()
                            }
                        },
                        {
                            'datasource': datasource,
                            'error': that.showError
                        }
                    );
                    if (success) {
                        that.options.popup.options.add && that.collection.add(that.model);
                        that.options.popup.remove();
                        that.remove();
                    }
                },
                error: that.options.popup.showError
            });
        }
        return false;
    },
    assets: function() {
        (new LibraryList()).fetch({
            success: function(collection) {
                new LibraryListPopupView({
                    collection: collection,
                    target: $('input#file')
                });
            }
        });
        return false;
    },
    selectSRS: function() {
        var name = $('select#srs-name', this.el).val();
        if (name === 'custom') {
            $('.srs', this.el).show();
        } else {
            $('input#srs', this.el).val(this.model.SRS[name]);
            $('.srs', this.el).hide();
        }
    }
});

// PostgisLayerForm
// ----------------
var PostgisLayerForm = Backbone.View.extend({
    events: {
        'click input.submit': 'submit',
        'change select#srs-name': 'selectSRS'
    },
    initialize: function(options) {
        _.bindAll(this, 'submit', 'selectSRS');
        this.model = this.options.model;
        var object = {};
        object['id'] = this.model.id;
        object['class'] = this.model.get('class');
        object['srs'] = this.model.get('srs');
        object['srs_name_' + this.model.srsName()] = true;
        var datasource = this.model.get('Datasource') || {};
        object['host'] = datasource.host || 'localhost';
        object['port'] = datasource.port || '5432';
        object['database'] = datasource.database || '';
        object['username'] = datasource.username || '';
        object['password'] = datasource.password || '';
        object['dbname'] = datasource.dbname || '';
        object['table'] = datasource.table || '';
        object['geometry_field'] = 'the_geom';
        object['estimate_extent'] = 'true';
        $(this.el).html(ich.PostgisLayerForm(object, true));
    },
    submit: function() {
        var that = this;
        var datasource = new PostgisDatasource();
        var success = datasource.set({
            id: $('input#id', this.el).val(),
            ds_type: 'postgis',
            host: $('input#host', this.el).val(),
            port: $('input#port', this.el).val(),
            database: $('input#database', this.el).val(),
            username: $('input#username', this.el).val(),
            password: $('input#password', this.el).val(),
            dbname: $('input#dbname', this.el).val(),
            table: $('input#table', this.el).val(),
            geometry_field: $('input#geometry_field', this.el).val(),
            estimate_extent: $('input#estimate_extent', this.el).val()
        }, { error: that.options.popup.showError });
        if (success) {
            this.options.popup.loading('Loading datasource');
            datasource.fetch({
                success: function() {
                    that.options.popup.done();
                    var success = that.model.set(
                        {
                            'id': $('input#id', that.el).val(),
                            'name': $('input#id', that.el).val(),
                            'srs': $('input#srs', that.el).val(),
                            'class': $('input#class', that.el).val(),
                            'Datasource': {
                                host: $('input#host', this.el).val(),
                                port: $('input#port', this.el).val(),
                                database: $('input#database', this.el).val(),
                                username: $('input#username', this.el).val(),
                                password: $('input#password', this.el).val(),
                                dbname: $('input#dbname', this.el).val(),
                                table: $('input#table', this.el).val(),
                                geometry_field: $('input#geometry_field', this.el).val(),
                                estimate_extent: $('input#estimate_extent', this.el).val(),
                                type: 'postgis'
                            }
                        },
                        {
                            'datasource': datasource,
                            'error': that.showError
                        }
                    );
                    if (success) {
                        that.options.popup.options.add && that.collection.add(that.model);
                        that.options.popup.remove();
                        that.remove();
                    }
                },
                error: that.options.popup.showError
            });
        }
        return false;
    },
    selectSRS: function() {
        var name = $('select#srs-name', this.el).val();
        if (name === 'custom') {
            $('.srs', this.el).show();
        } else {
            $('input#srs', this.el).val(this.model.SRS[name]);
            $('.srs', this.el).hide();
        }
    }
});


// LayerDrawerView
// ---------------
// Drawer view for inspecting a layer datasource. Renders only the first 1000
// cells of large datasources to not spam the DOM. A button allows for showing
// the rest.
var DatasourceView = DrawerView.extend({
    className: 'drawer',
    events: _.extend({
        'click .showall .button': 'deferredRender'
    }, DrawerView.prototype.events),
    initialize: function(options) {
        options.title = this.model.id;
        options.content = '';
        DrawerView.prototype.initialize.call(this, options);

        _.bindAll(this, 'deferredRender', 'loadFields');
        var that = this;
        this.bind('render', function() {
            that.loading('Loading datasource');
            that.model.fetchFeatures({
                'success': that.loadFields,
                'error': that.loadFields
            });
        });
        this.features = [];
        this.deferredFeatures = [];
    },
    loadFields: function() {
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
            } else {
                this.deferredFeatures.push({ values: featureArray });
            }
        }
        object.rows = ich.DatasourceRowsView({features: this.features}, true);
        object.more = this.deferredFeatures.length;

        this.done();
        this.$('.drawer-content').html(ich.DatasourceView(object, true));
        return this;
    },
    deferredRender: function() {
        var rows = ich.DatasourceRowsView({features: this.deferredFeatures});
        this.$('table.features tbody').append(rows);
        this.$('.drawer-content .showall').remove();
        return false;
    }
});

