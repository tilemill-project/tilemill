// AssetListS3
// -----------
// Collection. Override of AssetList for S3 library. S3 uses a marker key
// system for pagination instead of a page # system.
model = models.Assets.extend({
    url: function() {
        var url = 'api/Library/' + this.library.id + '/assets';
        if (this.marker()) {
            url += '/' + Base64.encodeURI(this.marker());
        }
        return url;
    },
    initialize: function(options) {
        this.markers = [];
        this.library = options.library;
    },
    marker: function() {
        if (this.markers.length) {
            return this.markers[this.markers.length - 1];
        }
        return false;
    },
    parse: function(response) {
        if (this.marker() != response.marker) {
            this.markers.push(response.marker);
        }
        return response.models;
    },
    hasNext: function() {
        return this.marker();
    },
    hasPrev: function() {
        return this.markers.length > 1;
    },
    nextPage: function(options) {
        if (!this.hasNext()) return;
        this.fetch(options);
    },
    prevPage: function(options) {
        if (!this.hasPrev()) return;
        this.markers.pop();
        this.markers.pop();
        this.fetch(options);
    }
});

