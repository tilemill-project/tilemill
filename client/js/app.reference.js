/**
 * Router controller: Reference page.
 */
var ReferenceView = DrawerView.extend({
    events: _.extend({
        'click .reference-links a': 'show'
    }, DrawerView.prototype.events),
    initialize: function (options) {
        _.bindAll(this, 'show');
        var symbolizers = _.map(window.data.reference.symbolizers, function(properties, symbolizer) {
            return {
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
            };
        });
        this.options = {
            title: 'Reference',
            content: ich.ReferenceView({ symbolizers: symbolizers }, true)
        };
        DrawerView.prototype.initialize.call(this, options);
    },
    show: function(event) {
        var link = $(event.target);
        var section = link.attr('href').split('#').pop();
        this.$('.reference-links a.active').removeClass('active');
        this.$('.reference-section.active').removeClass('active');
        link.addClass('active');
        this.$('#' + section).addClass('active');
        return false;
    }
});
