/**
 * Router controller: Reference page.
 */
TileMill.controller.reference = function() {
  TileMill.show(ich.reference({}));
  $.getJSON('js/data/reference.json', {}, function(data) {
    _.map(data.symbolizers, function(properties, symbolizer) {
      $('#main-content').append(ich.reference_symbolizer({
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
};

TileMill.reference = {};
