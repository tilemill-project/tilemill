var Datasource = Backbone.Model.extend({
});

var DatasourceListS3 = Backbone.Collection.extend({
    model: Datasource,
    url: '/provider/s3'
});

var DatasourceListDirectory = Backbone.Collection.extend({
    model: Datasource,
    url: '/provider/directory'
});

var DatasourceListView = Backbone.View.extend({
    id: 'datasource-list',
    initialize: function () {
        _.bindAll(this, 'render');
        this.collection.bind('all', this.render);
        this.collection.fetch();
    },
    render: function () {
        var self = this;
        this.collection.each(function(model) {
            var datasourceRow = new DatasourceRowView({
                model: model,
                target: self.options.target
            });
            $(self.el).append(datasourceRow.el);
        });
        return this;
    },
});

var DatasourceRowView = Backbone.View.extend({
    className: 'datasource',
    initialize: function() {
        _.bindAll(this, 'render', 'setfield');
        this.render();
    },
    render: function() {
        $(this.el).html(ich.DatasourceRow({
            id: this.model.id,
            bytes: this.model.get('bytes'),
            url: this.model.get('url')
        }));
        return this;
    },
    events: {
        'click': 'setfield'
    },
    setfield: function() {
        this.options.target.val(this.model.get('url'));
    }
});

