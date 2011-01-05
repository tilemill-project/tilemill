/**
 * Router controller: Reference page.
 */
var ReferenceView = Backbone.View.extend({
    initialize: function () {
        this.render();
    },

    render: function () {
        $(this.el).html(ich.ReferenceView());
        var that = this;        
        _.map(window.data.reference.symbolizers, function(properties, symbolizer) {
            $('#main-content', that.el).append(ich.reference_symbolizer({
                properties: _.map(properties, function(property, name) {
                    return {
                        property_name: name,
                        css: property.css,
                        type: _.isArray(property.type) ?
                            property.type.join(', ') :
                            property.type,
                        default_value: property['default-value'],
                        doc: property['doc'] || '',
                        default_meaning: property['default-meaning'] || ''
                    }; // TODO extend instead
                }),
                symbolizer: symbolizer
            }));
        });
        window.app.el.html(this.el);
        return this;
    }
});
