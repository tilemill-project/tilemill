var Layer = Backbone.Model.extend({
});

var LayerList = Backbone.Collection.extend({
});

var LayerListView = Backbone.View.extend({
    id: 'layers',
    initialize: function() {
        _.bindAll(this, 'render');
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
                collection: this.collection
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
        alert('@TODO add');
        return false;
    }
});

var LayerRowView = Backbone.View.extend({
    tagName: 'li',
    className: 'clearfix',
    initialize: function () {
        _.bindAll(this, 'render');
        this.render();
    },
    render: function () {
        // @TODO: properly render name as "#id, .class", etc.
        this.model.set({'name': this.model.get('id')});
        $(this.el).html(ich.LayerRowView(this.model.attributes));
        return this;
    },
    events: {
        'click .layer-delete': 'delete',
        'click .layer-inspect': 'inspect',
        'click .layer-edit': 'edit'
    },
    edit: function() {
        alert('@TODO edit');
        return false;
    },
    inspect: function() {
        alert('@TODO inspect');
        return false;
    },
    delete: function() {
        alert('@TODO delete');
        return false;
    }
});

