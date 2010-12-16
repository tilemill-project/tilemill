/**
 * Router controller: Reference page.
 */
TileMill.controller.reference = function() {
  TileMill.show(TileMill.template('reference', {}));

  $.getJSON('js/data/reference.json', {}, function(data) {
    _.map(data.symbolizers, function(properties, symbolizer) {
      $('#main-content').append(TileMill.template('reference-symbolizer', {
        properties: _.map(properties, function(property, name) {
          return TileMill.template('reference-property', {
            property_name: name,
            css: property.css,
            type: _.isArray(property.type) ?
              property.type.join(', ') :
              property.type,
            default_value: property['default-value'],
            doc: property['doc'] || '',
            default_meaning: property['default-meaning'] || ''
          }); // TODO extend instead
        }).join(''),
        symbolizer: symbolizer
      }));
    });
  });
};

TileMill.reference = {};
