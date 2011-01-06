var Layer = Backbone.Model.extend({
    // @TODO either as a feature or a bug, object attributes are not set
    // automatically when passed to the constructor. We set it manually here.
    initialize: function(attributes) {
        this.set({'Datasource': attributes.Datasource});
    },
    validate: function() {
    }
});

var LayerList = Backbone.Collection.extend({
    model: Layer,
    initialize: function(models, options) {
        var self = this;
        this.parent = options.parent;
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
    initialize: function() {
        _.bindAll(this, 'render');
        this.render();
        this.collection.bind('add', this.render);
        this.collection.bind('remove', this.render);
        this.render();
        /*
        @TODO: bind re-render to project events.
        */
    },
    render: function() {
        var self = this;
        $(this.el).html(ich.LayerListView());
        this.collection.each(function(layer) {
            var layerRow = new LayerRowView({
                model: layer,
                list: self
            });
            $('ul', self.el).append(layerRow.el);
        });
        $('ul', self.el).sortable({
            axis: 'y',
            handle: 'div.handle'
            // @TODO: proper event.
            // change: TileMill.project.changed
        });
        return this;
    },
    events: {
        'click #layers-add': 'add'
    },
    add: function() {
        new LayerPopupView({
            collection: this.collection,
            model: new Layer,
            add: true
        });
        return false;
    }
});

var LayerRowView = Backbone.View.extend({
    tagName: 'li',
    className: 'clearfix',
    initialize: function (params) {
        _.bindAll(this, 'render', 'edit', 'inspect', 'del');
        this.list = params.list;
        this.render();
    },
    render: function () {
        // @TODO: properly render name as "#id, .class", etc.
        this.model.set({'name': this.model.get('id')});
        $(this.el).html(ich.LayerRowView(this.model.attributes));
        return this;
    },
    events: {
        'click .layer-delete': 'del',
        'click .layer-inspect': 'inspect',
        'click .layer-edit': 'edit'
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
        alert('@TODO inspect');
        return false;
    },
    del: function() {
        window.app.loading();
        if (confirm('Are you sure you want to delete this layer?')) {
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
    events: _.extend(PopupView.prototype.events, {
        'click input.submit': 'submit',
        'click a#expand-datasources': 'datasources'
    }),
    initialize: function(params) {
        _.bindAll(this, 'render', 'submit', 'datasources');
        this.model = this.options.model;
        this.options.title = this.options.add ? 'Add layer' : 'Edit layer';
        this.options.content = ich.LayerPopupView({
            'id': this.model.id,
            'class': this.model.get('class'),
            datasource_file: this.model.get('Datasource') ? this.model.get('Datasource').file : '',
        }, true);
        this.render();
    },
    submit: function() {
        this.model.set({
            'id': $('input#id', this.el).val(),
            'srs': $('input#srs', this.el).val(),
            'class': $('input#class', this.el).val(),
            'Datasource': {
                'file': $('input#file', this.el).val(),
                'type': 'shape',
                'estimate_extent': 'id',
                'id': $('input#id', this.el).val()
            }
        });
        var error = this.model.validate();
        if (error) {
            window.app.message('Error', error);
        }
        else {
            this.collection.add(this.model);
            this.remove();
        }
        return false;
    },
    datasources: function() {
        if (!this.list) {
            this.list = new DatasourceListView({
                collection: new DatasourceListDirectory,
                target: $('input#file', this.el)
            });
            $('.datasources', this.el).append(this.list.el);
        }
        $('.datasources', this.el).toggle();
        return false;
    }
});

