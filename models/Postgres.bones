model = Backbone.Model.extend({});

model.prototype.url = function() {
    return this.id ? '/api/Postgres/' + this.id : '/api/Postgres';
};
