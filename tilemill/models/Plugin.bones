model = Backbone.Model.extend();

model.prototype.url = function() {
    return '/api/Plugin/' + this.id
};
