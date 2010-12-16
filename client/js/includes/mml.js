/**
 * MML and MSS generation, manipulation tools.
 */
TileMill.mml = {};
TileMill.mss = {};

/**
 * Render an MSS string from a structured array.
 */
TileMill.mss.generate = function(mss) {
  var output = [];
  for (var i in mss) {
    output.push(i + ' {');
    if (mss[i]) {
      for (var j in mss[i]) {
        output.push('  ' + j + ': ' + mss[i][j] + ';');
      }
    }
    output.push('}');
    output.push('');
  }
  return output.join('\n');
};

/**
 * Determine and normalize any recognizable SRS strings. If the string is
 * unknown, return false.
 */
TileMill.mml.srs = function(srs) {
  for (var entity in TileMill.settings.srs) {
    if (
      (entity === srs) ||
      ('&' + entity + ';' === srs) ||
      (TileMill.settings.srs[entity] === srs)
    ) {
      return '&' + entity + ';';
    }
  }
  return false;
};

/**
 * Render an MML string from a structured array.
 */
TileMill.mml.generate = function(mml) {
  // We can't store the MML in an HTML template because the template engine
  // strips out all whitespace. While this is ok for HTML templates, which just
  // get put in the DOM, we want the MML that we end up with to be readable by
  // humans. Thus, we have to keep it entirely in JavaScript and join the
  // lines together at the end of the script.
  var output = ['<' + '?xml version="1.0" encoding="utf-8"?>'];
  output.push('<!DOCTYPE Map[');
  for (var entity in TileMill.settings.srs) {
    output.push('  <!ENTITY ' + entity + ' "' + TileMill.settings.srs[entity] + '">');
  }
  output.push(']>');
  output.push('<Map srs="&srs900913;">');

  // Add metadata to the MML file.
  if (mml.metadata) {
    output.push('  <![CDATA[ ' + JSON.stringify(mml.metadata) + ' ]]>');
  }

  // Add the stylesheets to the MML file.
  if (mml.stylesheets) {
    for (i = 0; i < mml.stylesheets.length; i++) {
      output.push('  <Stylesheet src="' + mml.stylesheets[i].replace('&', '&amp;') + '" />');
    }
  }

  // TODO: KILL KILL KILL
  // And add the layers.
  if (mml.layers) {
    for (i = 0; i < mml.layers.length; i++) {
      var layer = mml.layers[i], layerDef = '  <Layer';
      if (layer.id) {
        layerDef += ' id="' + layer.id + '"';
      }
      if (layer.classes) {
        layerDef += ' class="' + layer.classes + '"';
      }
      if (!layer.srs) {
        // @TODO detect SRS.
        layer.srs = '&srsWGS84;';
      }
      layerDef += ' srs="' + layer.srs + '"';
      if (mml.layers[i].status !== undefined && !mml.layers[i].status) {
        layerDef += ' status="off"';
      }
      layerDef += '>';
      output.push(layerDef);
      output.push('    <Datasource>');
      output.push('      <Parameter name="file">' +
              layer.file.replace('&', '&amp;') + '</Parameter>');
      if (!layer.type) {
        layer.type = 'shape';
      }
      output.push('      <Parameter name="type">' +
              layer.type + '</Parameter>');
      output.push('      <Parameter name="estimate_extent">' +
              'true</Parameter>');
      if (layer.id) {
        output.push('      <Parameter name="id">' +
                layer.id + '</Parameter>');
      }
      output.push('    </Datasource>');
      output.push('  </Layer>');
    }
  }
  output.push('</Map>');
  return output.join('\n');
};

/**
 * Parse an MML string into a structured array.
 */
TileMill.mml.parseMML = function(mml) {
  var parsed = {
    metadata: {},
    stylesheets: [],
    layers: []
  };
  // Parse metadata.
  var matches = mml.match(/<\!\[CDATA\[(.+)\]\]\>/);
  if (matches && matches[1]) {
    parsed.metadata = eval('(' + matches[1] + ')');
  }

  // Parse stylesheets.
  $(mml).find('Stylesheet').each(function() {
    if ($(this).attr('src')) {
      parsed.stylesheets.push($(this).attr('src'));
    }
  });
  // Parse layers.
  $(mml).find('Layer').each(function() {
    var status = $(this).attr('status');
    if (status == 'undefined' || status === undefined || status == 'on') {
      status = true;
    } else {
      status = false;
    }
    var classes = '';
    if ($(this).attr('class')) {
      classes = $(this).attr('class');
    }
    var srs = $(this).attr('srs');
    parsed.layers.push({
      classes: classes,
      id: $(this).attr('id'),
      status: status,
      file: $(this).find('Datasource Parameter[name=file]').text(),
      srs: srs
    });
  });
  return parsed;
};

TileMill.mml.showDatasources = function() {
    _.map(TileMill.settings.providers, function(provider) {
    // TODO: generalize
    $.jsonp({
        url: provider,
        data: {},
        callbackParameter: 'callback',
        error: function(xOptions, textStatus) {
          // TODO: specify where
          TileMill.message('Error', 'Request ' +
            'failed: could not connect' +
            ' to server',
            'error');
        },
        success: function(res) {
          _.map(res.provider, function(p) {
            $.jsonp({
              url: provider + p,
              data: {},
              callbackParameter: 'callback',
              error: function(xOptions, textStatus) {
                // TODO: specify where
                TileMill.message('Error', 'Request ' +
                  'failed: could not connect' +
                  ' to server',
                  'error');
              },
              success: function(res) {
                $('#form-providers').append(TileMill.template('data-provider', {
                  name: res.name,
                  datasources: _.map(res.datasources, function(ds) {
                    return TileMill.template('data-datasource', ds);
                  }).join('')
                }));
                $('#form-providers .datasource').click(function() {
                  $('#form-layer #file').val($('.url', this).text());
                });
              }
            });
          });
        }
    });
  });
};

/**
 * Initialize a layer edit/addition form.
 */
TileMill.mml.layerForm = function(popup, li, options) {
  // Populate form values.
  for (var option in options) {
    if (option === 'srs') {
      var srs = TileMill.mml.srs(options[option]);
      if (srs) {
        $('#' + option, popup).val(srs);
      } else {
        $('#' + option, popup).val('custom');
        $('#srs-custom', popup).val(options[option]);
      }
    } else {
      $('#' + option, popup).val(options[option]);
    }
  }

  // Create reference to layer li for submit handler to find.
  if (li) {
    $('form', popup).data('li', li);
  }

  $('#expand-datasources').click(function() {
    $('#form-providers').show().css('height', '150px');
    TileMill.mml.showDatasources();
  });

  // Custom SRS selector switch.
  $('select#srs', popup).change(function() {
    if ($(this).val() === 'custom') {
      $('div.srs-custom', $(this).parents('form')).show();
    } else {
      $('div.srs-custom', $(this).parents('form')).hide();
    }
  });
  $('select#srs', popup).change();

  // Add submit handler.
  $('form', popup).validate({
    errorLabelContainer: 'form .messages',
    submitHandler: function(form) {
      var layer = {
        classes: $('input#classes', form).val(),
        id: $('input#id', form).val(),
        file: $('input#file', form).val(),
        srs: $('select#srs', form).val(),
        status: 'true'
      };
      popup.append(TileMill.template('loading', {}));
      TileMill.backend.datasource(Base64.urlsafe_encode(layer.file), function(info) {
        // Set layer SRS.
        if (layer.srs === 'auto') {
          layer.srs = info.srs ? info.srs : '&srsWGS84;';
        }
        else if (layer.srs === 'custom') {
          layer.srs = $('input#srs-custom', form).val();
        }

        // Update an existing layer item.
        var li = $(form).data('li');
        if (li) {
          var name = [];
          if (layer.id) {
            name.push('#' + layer.id);
          }
          if (layer.classes) {
            name.push('.' + layer.classes.split(' ').join(', .'));
          }
          $(li)
            .data('tilemill', layer)
            .find('label').text(name.join(', '));
        }
        // Add a new layer item.
        else {
          TileMill.mml.add(layer, $('#layers'));
        }
        TileMill.popup.hide();
        TileMill.project.changed();
      });
      return false;
    }
  });
};

/**
 * Add a layer li to the layer dialog.
 */
TileMill.mml.add = function(options, layers) {
  var name = [];
  if (options.id) {
    name.push('#' + options.id);
  }
  if (options.classes.length) {
    name.push('.' + options.classes.split(' ').join(', .'));
  }
  var status = options.status == 'true' || options.status === true;
  var li = $(TileMill.template('layers-li', {name: name.join(', '), status: status}));

  $('ul.sidebar-content', layers).prepend(li);

  $('a.layer-delete', li).click(function() {
    if (confirm('Are you sure you want to delete this layer?')) {
      $(this).parents('li').hide('fast', function() {
        $(this).remove();
        TileMill.project.changed();
      });
    }
    return false;
  });

  $('a.layer-inspect', li).click(function() {
    // @TODO refactor this out.
    if (!$(this).parents('li').data('tilemill').id) {
      alert('You need to add an id to a field and save to inspect it.');
      return false;
    }
    $('#inspector .sidebar-header h2').html('Layers &raquo; ' +
        $(this).parents('li').find('label').text());
    $('#layers').hide();
    $('#inspector').show();
    TileMill.inspector.inspect($(this).parents('li').data('tilemill').id, false);
    return false;
  });

  $('a.layer-edit', li).click(function() {
    var popup = $(TileMill.template('popup-layer', {submit: 'Save'}));
    var li = $(this).parents('li');
    var options = li.data('tilemill');
    TileMill.popup.show({content: popup, title: 'Edit layer'});
    TileMill.mml.layerForm(popup, li, options);
    return false;
  });

  // Attach layer data to li element.
  li.data('tilemill', options);
};

/**
 * Save an MML string to the backend.
 */
TileMill.mml.save = function(data) {
  filename = [TileMill.data.type, TileMill.data.id, TileMill.data.id + '.mml'].join('/');
  TileMill.backend.post(filename, data);
};

/**
 * Generate the URL of the current project .mml file.
 */
TileMill.mml.url = function(options) {
  if (!options) {
    options = {};
  }
  options = $.extend({ timestamp: true, encode: true }, options);
  var url = TileMill.backend.url(TileMill.data.filename);
  if (options.timestamp) {
    url += '&c=' + TileMill.data.uniq;
  }
  if (options.encode) {
    url = Base64.urlsafe_encode(url);
  }
  return url;
};

/**
 * Init layers and return markup.
 */
TileMill.mml.init = function() {
  var layers = $(TileMill.template('layers', {}));
  var l = TileMill.mml.parseMML(TileMill.data.mml).layers;
  for (var layer in l) {
    TileMill.mml.add(l[layer], layers);
  }
  $('ul.sidebar-content', layers).sortable({
    axis: 'y',
    handle: 'div.handle',
    change: TileMill.project.changed
  });

  $('a#layers-add', layers).click(function() {
    var popup = $(TileMill.template(
      'popup-layer', {
          submit: 'Add layer'
      }));
    TileMill.popup.show({
        content: popup,
        title: 'Add layer'
    });
    TileMill.mml.layerForm(popup, false, {});
    return false;
  });

  return layers;
};
