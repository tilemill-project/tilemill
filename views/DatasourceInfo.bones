view = Backbone.View.extend();

view.prototype.events = {
    'click a.showall': 'showAll'
};

view.prototype.featureLimit = 100;

view.prototype.initialize = function(options) {
    this.render();
};

view.prototype.render = function() {
    var features = this.model.get('features');
    this.$('.content').html(templates.DatasourceInfo({
        fields: this.model.get('fields'),
        features: _(features).first(this.featureLimit),
        more: _(features).size() > this.featureLimit
    }));
    return this;
};

view.prototype.showAll = function() {
    this.$('a.showall').hide();
    this.$('.content table tbody').append(templates.DatasourceInfoRows({
        fields: this.model.get('fields'),
        features: _(this.model.get('features')).rest(this.featureLimit)
    }));
    return false;
}

