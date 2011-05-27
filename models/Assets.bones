// AssetList
// ---------
// Collection. List of all assets for a given Library. Must be given a
// Library model at `options.library` in order to determine its URL endpoint.
// The REST endpoint for a LibraryList collection must return an array of asset
// models, or may optionally return a more complex object suited for handling
// pagination:
//
//      {
//          page: 0,        // The current page number
//          pageTotal: 10,  // The total number of pages
//          models: []      // An array of asset models
//      }
model = Backbone.Collection.extend({
    model: models.Asset,
    url: function() {
        return 'api/Library/' + this.library.id + '/assets/' + this.page;
    },
    initialize: function(options) {
        this.page = 0;
        this.pageTotal = 1;
        this.library = options.library;
    },
    parse: function(response) {
        if (_.isArray(response)) {
            return response;
        } else {
            this.page = response.page;
            this.pageTotal = response.pageTotal;
            return response.models;
        }
    },
    hasNext: function() {
        return this.page < (this.pageTotal - 1);
    },
    hasPrev: function() {
        return this.page > 0;
    },
    nextPage: function(options) {
        if (!this.hasNext()) return;
        this.page++;
        this.fetch(options);
    },
    prevPage: function(options) {
        if (!this.hasPrev()) return;
        this.page--;
        this.fetch(options);
    }
});

