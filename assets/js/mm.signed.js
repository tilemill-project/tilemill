// Extend Modest Maps WaxProvider to allow for a query-string signed URL based
// on the last updated time of the project.
var wax = wax || {};
wax.mm = wax.mm || {};

wax.mm.signedProvider = function(options) {
    this.layerName = options.layerName;
    this.baseUrls = (typeof(options.baseUrl) == 'string') ?
            [options.baseUrl] : options.baseUrl;
    this.n_urls = this.baseUrls.length;
    this.filetype = options.filetype || '.png';
    this.zoomRange = options.zoomRange || [0, 18];
    this.signature = options.signature || null;
};

wax.mm.signedProvider.prototype = {
    getTileUrl: function(coord) {
        var server;
        coord = this.sourceCoordinate(coord);
        if (!coord) {
            return null;
        }

        var worldSize = Math.pow(2, coord.zoom);
        coord.row = Math.pow(2, coord.zoom) - coord.row - 1;
        if (this.n_urls === 1) {
            server = this.baseUrls[0];
        } else {
            server = this.baseUrls[parseInt(worldSize * coord.row + coord.column, 10) % this.n_urls];
        }
        var imgPath = ['1.0.0', this.layerName, coord.zoom, coord.column, coord.row].join('/');
        var url = server + imgPath + this.filetype;
        (this.signature) && (url += '?updated=' + this.signature);
        return url;
    }
};

com.modestmaps.extend(wax.mm.signedProvider, wax.mm.provider);
