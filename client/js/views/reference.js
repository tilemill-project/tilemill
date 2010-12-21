/**
 * Router controller: Reference page.
 */
var ReferenceView = Backbone.View.extend({
  el: $('#reference-page'),
  
  render: function() {
    var that = this;
    $(this.el).html(ich.reference({}));
    console.log(this.el);
    $.getJSON('js/data/reference.json', {}, function(data) {
      _.map(data.symbolizers, function(properties, symbolizer) {
        $(that.el).append(ich.reference_symbolizer({
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
    });
  },
  initialize: function() {
  }
});
