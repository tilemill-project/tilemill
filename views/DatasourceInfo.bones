view = Backbone.View.extend();

view.prototype.initialize = function(options) {
    this.render();

};

view.prototype.render = function() {
    this.$('.content').html(templates.DatasourceInfo({
        fields: this.model.get('fields'),
        features: this.model.get('features')
    }));
    return this;
};

