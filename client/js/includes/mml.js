TileMill.mml = {};
TileMill.mss = {};
TileMill.customSrs = [];

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
  return output.join("\n");  
};

TileMill.mml.generate = function(mml) {
  // We can't store the MML in an HTML template because the template engine
  // strips out all whitespace. While this is ok for HTML templates, which just
  // get put in the DOM, we want the MML that we end up with to be readable by
  // humans. Thus, we have to keep it entirely in JavaScript and join the
  // lines together at the end of the script.
  var output = ['<' + '?xml version="1.0" encoding="utf-8"?>',
  '<!DOCTYPE Map[',
  '  <!ENTITY srs900913 "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs">',
  '  <!ENTITY srsWGS84 "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs">',
  ']>'];

  output.push('<Map srs="&srs900913;">');

  // Add metadata to the MML file.
  if (mml.metadata) {
    output.push('  <![CDATA[ ' + JSON.stringify(mml.metadata) + ' ]]>');
  }

  // Add the stylesheets to the MML file.
  if (mml.stylesheets) {
    for (i = 0; i < mml.stylesheets.length; i++) {
      output.push('  <Stylesheet src="' + mml.stylesheets[i] + '" />');
    }
  }

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
        // Detect SRS.
        layer.srs = 'WGS84';
      }
      layerDef += ' srs="&srs' + layer.srs + ';"';
      if (mml.layers[i].status != undefined && !mml.layers[i].status) {
        layerDef += ' status="off"';
      }
      layerDef += '>';
      output.push(layerDef);
      output.push('    <Datasource>');
      output.push('      <Parameter name="file">' + layer.file + '</Parameter>');
      if (!layer.type) {
        layer.type = 'shape';
      }
      output.push('      <Parameter name="type">' + layer.type + '</Parameter>');
      if (layer.id) {
        output.push('      <Parameter name="id">' + layer.id + '</Parameter>');
      }
      output.push('    </Datasource>');
      output.push('  </Layer>');
    }
  }
  output.push('</Map>');
  return output.join("\n");
};

TileMill.mml.parseMML = function(mml) {
  var parsed = {
    metadata: {},
    stylesheets: [],
    layers: [],
  };
  // Parse metadata.
  var matches = mml.match(/\<\!\[CDATA\[(.+)\]\]\>/);
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
    if (status == 'undefined' || status == undefined || status == 'on') {
      status = true;
    }
    else {
      status = false;
    }
    var classes = '';
    if ($(this).attr('class')) {
      classes = $(this).attr('class');
    }
    var srs = $(this).attr('srs'), parsed_srs = srs.replace(/^&srs(.*);$/, '$1');
    if (parsed_srs == srs) {
      var pass = false;
      for (var key in TileMill.customSrs) {
        if (TileMill.customSrs[key] == srs) {
          pass = true;
          continue;
        }
      }
      if (!pass) {
        TileMill.customSrs.push(srs);
      }
    }
    else {
      srs = parsed_srs;
    }
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

TileMill.mml.add = function(options, layers) {
  var name = [];
  if (options.id) {
    name.push('#' + options.id);
  }
  if (options.classes.length) {
    name.push('.' + options.classes.split(' ').join(', .'));
  }
  var status = options.status == 'true' || options.status == true;
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
    if (!$(this).parents('li').data('tilemill')['id']) {
      alert('You need to add an id to a field and save to inspect it.');
      return false;
    }
    $('#inspector .sidebar-header h2').html('Layers &raquo; ' + $(this).parents('li').find('label').text());
    $('#layers').hide();
    $('#inspector').show();
    TileMill.inspector.inspect($(this).parents('li').data('tilemill').id, false);
    return false;
  });

  $('a.layer-edit', li).click(function() {
    var popup = $(TileMill.template('popup-layer', {submit:'Save'}));

    // Populate form values.
    var options = $(this).parents('li').data('tilemill');
    for (option in options) {
      $('#' + option, popup).val(options[option]).end();
    }

    TileMill.popup.show({content: popup, title: 'Edit layer'});

    // Create reference to layer li for submit handler to find.
    $('form', popup).data('li', $(this).parents('li'));

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
        var name = [];
        if (layer.id) {
          name.push('#' + layer.id);
        }
        if (layer.classes) {
          name.push('.' + layer.classes.split(' ').join(', .'));
        }
        var li = $(form).data('li');
        $(li)
          .data('tilemill', layer)
          .find('label').text(name.join(', '));
        TileMill.popup.hide();
        TileMill.project.changed();
        return false;
      }
    });
    return false;
  });

  // Attach layer data to li element.
  li.data('tilemill', options);
};

TileMill.mml.save = function(data) {
  filename = [TileMill.settings.type, TileMill.settings.id, TileMill.settings.id + '.mml'].join('/');
  TileMill.backend.post(filename, data);
};

/**
 * Generate the URL of the current project .mml file.
 */
TileMill.mml.url = function(options) {
  if (!options) {
    var options = {};
  }
  options = $.extend({ timestamp: true, encode: true }, options);
  var url = TileMill.backend.url(TileMill.settings.filename);
  if (options.timestamp) {
    url += '&c=' + TileMill.uniq;
  }
  if (options.encode) {
    url = Base64.urlsafe_encode(url);
  }
  return url;
};

// @TODO: Move more of this to the controller.
TileMill.mml.init = function() {
  var layers = $(TileMill.template('layers', {}));
  var l = TileMill.mml.parseMML(TileMill.settings.mml).layers;
  for (var layer in l) {
    TileMill.mml.add(l[layer], layers);
  }
  $('ul.sidebar-content', layers).sortable({ axis: 'y', handle: 'div.handle', change: TileMill.project.changed });

  TileMill.inspector.load();
  for (var i in TileMill.customSrs) {
    var srs = TileMill.customSrs[i];
    if (srs.length > 23) {
      srs = srs.substr(0, 20) + '...';
    }
    $('select#srs').append('<option value="' + TileMill.customSrs[i].replace('"', '\\"') + '">' + srs + "</option>");
  }

  $('a#layers-add', layers).click(function() {
    var popup = $(TileMill.template('popup-layer', {submit: 'Add layer'}));
    TileMill.popup.show({content: popup, title: 'Add layer'});

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
        TileMill.mml.add(layer, $('#layers'));
        TileMill.popup.hide();
        TileMill.project.changed();
        return false;
      }
    });
    return false;
  });

  return layers;
};
