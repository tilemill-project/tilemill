// Favorites
// ---------
// Collection of Favorite models.
model = Backbone.Collection.extend();
model.prototype.model = models.Favorite;
model.prototype.url = '/api/Favorite';
// toLibrary(id, [context])
// id:      Library tab type — 'favoritesFile' (filesystem paths),
//          'favoritesPostGIS' (PostGIS connection strings), 'favoritesSqlite'.
//          Note: the Postgres page stores OSM file paths, so it uses 'favoritesFile'.
// context: page that added the favorite — 'layer', 'postgres', etc.
//          If provided, only favorites matching that context are returned
//          (plus untagged legacy entries saved before context tagging was added).
model.prototype.toLibrary = function(id, context) {
    var self = this;
    var type;
    var idFilter;
    switch (id) {
    case 'favoritesPostGIS':
        type = 'postgis';
        idFilter = function(id) { return id.indexOf('dbname=') !== -1; };
        break;
    case 'favoritesFile':
        type = 'file';
        idFilter = function(id) {
            return id.indexOf('dbname=') === -1 && id.indexOf('.sqlite') === -1;
        };
        break;
    case 'favoritesSqlite':
        type = 'sqlite';
        idFilter = function(id) {
            return id.indexOf('dbname=') === -1 && id.indexOf('.sqlite') !== -1;
        };
        break;
    }
    var models = context
        ? this.filter(function(m) {
              var c = m.get('context');
              return !c || c === context;   // include legacy (untagged) entries
          })
        : this.models;
    return {
        id: id,
        location: '',
        assets: _(models).chain()
            .map(function(m) { return m.id; })
            .filter(idFilter)
            .map(function(id) { return { name: id, uri: id }; })
            .value()
    };
};

model.prototype.comparator = function(m) {
  return -1 * (m.get('created')||0);
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
