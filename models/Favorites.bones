// Favorites
// ---------
// Collection of Favorite models.
model = Backbone.Collection.extend();
model.prototype.model = models.Favorite;
model.prototype.url = '/api/Favorite';
model.prototype.toLibrary = function(id) {
    var type = (id === 'favoritesPostGIS') ? 'postgis' : 'file';
    return {
        id: id,
        location: '',
        assets: this.chain()
            .pluck('id')
            .filter(function(id) {
                var postgis = id.indexOf('dbname=') !== -1;
                return type === 'postgis' ? !!postgis : !postgis;
            })
            .map(function(id) { return { name:id, uri:id }})
            .value()
    };
};

// Checks if a given id is a favorite. Adds normalization so PostGIS favorites
// match regardless of the order of the arguments.
model.prototype.isFavorite = function(id) {
    if (id.indexOf('dbname=') !== -1) {
        if (id == null) return null;
        var args = _(id.split(' ')).sortBy(function(arg) { return arg });
        return this.chain()
            .pluck('id')
            .filter(function(id) { return id.indexOf('dbname=') !== -1 })
            .map(function(id) { return _(id.split(' ')).sortBy(function(arg) { return arg }) })
            .filter(function(id) { return _(id).isEqual(args) })
            .first()
            .value();
    } else if (this.get(id)) {
        return true;
    }
}
