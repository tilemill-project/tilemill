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

// LayerRowView
// ------------
// Single layer row in a LayerListView.
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
        new DatasourceView({
            model: new Datasource({ 
                id: this.model.id,
                url: this.model.get('Datasource').file
            })
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
    events: _.extend({
        'click input.submit': 'submit',
        'click a.assets': 'assets',
        'change select#srs-name': 'selectSRS'
    }, PopupView.prototype.events),
    initialize: function(params) {
        _.bindAll(this, 'render', 'submit', 'assets', 'selectSRS');
        this.model = this.options.model;
        this.options.title = this.options.add ? 'Add layer' : 'Edit layer';

        var object = {};
        object['id'] = this.model.id;
        object['class'] = this.model.get('class');
        object['datasource_file'] = this.model.get('Datasource')
            ? this.model.get('Datasource').file
            : '';
        object['srs'] = this.model.get('srs');
        object['srs_name_' + this.model.srsName()] = true;
        this.options.content = ich.LayerPopupView(object, true);
        this.render();
    },
    submit: function() {
        var that = this;
        var datasource = new Datasource();
        var success = datasource.set({
            id: $('input#id', this.el).val(),
            url: $('input#file', this.el).val()
        }, { error: that.showError });
        if (success) {
            this.loading('Loading datasource');
            datasource.fetch({
                success: function() {
                    that.done();
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
                        that.options.add && that.collection.add(that.model);
                        that.remove();
                    }
                },
                error: that.showError
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

// LayerDrawerView
// ---------------
// Drawer view for inspecting a layer datasource. Renders only the first 1000
// cells of large datasources to not spam the DOM. A button allows for showing
// the rest.
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
            that.model.fetchFeatures({
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

