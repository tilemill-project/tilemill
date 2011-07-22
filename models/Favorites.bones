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
                var postgis = id.indexOf('pgsql://') === 0;
                return type === 'postgis' ? !!postgis : !postgis;
            })
            .map(function(id) { return { name:id, uri:id }})
            .value()
    };
};
