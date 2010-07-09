TileMill.mml = {};
TileMill.customSrs = [];

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
  ']>',
  '<Map srs="&srs900913;">'];

  // Add the stylesheets to the MML file.
  if (mml.stylesheets) {
    for (i = 0; i < mml.stylesheets.length; i++) {
      output.push('  <Stylesheet src="' + mml.stylesheets[i] + '" />');
    }
  }

  // And add the layers.
  if (layers) {
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
        layer.srs = '&srsWGS84;';
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



TileMill.mml.add = function(options) {
  var name = [];
  if (options.id) {
    name.push('#' + options.id);
  }
  if (options.classes.length) {
    name.push('.' + options.classes.split(' ').join(', .'));
  }
  var checkbox = $('<input class="checkbox" type="checkbox" />'),
    li = $('<li>')
    .append($('<div class="handle"></div>'))
    .append(checkbox)
    .append($('<a class="layer-delete" href="#">Delete</a>').click(function() {
      if (confirm('Are you sure you want to delete this layer?')) {
        $(this).parents('li').hide('fast', function() {
          $(this).remove();
        });
      }
      return false;
    }))
    .append($('<a class="layer-inspect" href="#">Inspect</a>').click(function() {
      // @TODO refactor this out.
      if (!$(this).parents('li').data('tilemill')['id']) {
        alert('You need to add an id to a field and save to inspect it.');
        return;
      }
      $('#inspector .sidebar-header h2').html('Layers &raquo; ' + $(this).parents('li').find('label').text());
      TileMill.inspector.inspect($(this).parents('li').data('tilemill').id);
      TileMill.page = 0;
      return false;
    }))
    .append($('<a class="layer-edit" href="#">Edit</a>').click(function() {
      var layer = $('#popup-layer').find('input.submit').val('Save').data('li', $(this).parents('li')).end(),
        options = $(this).parents('li').data('tilemill');
      for (option in options) {
        layer.find('#' + option).val(options[option]).end();
      }
      $('#popup-layer').removeClass('new');
      TileMill.popup.show({content: $('#popup-layer'), title: 'Edit layer'});
      return false;
    }))
    .append($('<label>' + name.join(', ') + '</label>'));
  if (options.status == 'true' || options.status == true) {
    checkbox[0].checked = true;
  }
  $('#layers ul.sidebar-content').prepend(li.data('tilemill', options));
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

TileMill.editor.mml = function() {
  $(TileMill.settings.mml).find('Layer').each(function() {
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
    TileMill.mml.add({
      classes: classes,
      id: $(this).attr('id'),
      status: status,
      dataSource: $(this).find('Datasource Parameter[name=file]').text(),
      srs: srs
    });
  });
  TileMill.inspector.load();
  for (var i in TileMill.customSrs) {
    var srs = TileMill.customSrs[i];
    if (srs.length > 23) {
      srs = srs.substr(0, 20) + '...';
    }
    $('select#srs').append('<option value="' + TileMill.customSrs[i].replace('"', '\\"') + '">' + srs + "</option>");
  }
  $('#layers ul.sidebar-content').sortable({ axis: 'y', handle: 'div.handle' });

  $('a#layers-add').click(function() {
    $('#popup-layer').addClass('new');
    $('#popup-layer input.submit').val('Add layer');
    $('#popup-layer input:not(.submit)').val('');
    TileMill.popup.show({content: $('#popup-layer'), title: 'Add layer'});
    return false;
  });

  $('#popup-layer input.submit').click(function() {
    var layer = {
      classes: $('#popup-layer input#classes').val(),
      id: $('#popup-layer input#id').val(),
      dataSource: $('#popup-layer input#dataSource').val(),
      srs: $('#popup-layer select#srs').val(),
      status: 'true'
    };
    if ($('#popup-layer').is('.new')) {
      TileMill.mml.add(layer);
    }
    else {
      var name = [];
      if (layer.id) {
        name.push('#' + layer.id);
      }
      if (layer.classes) {
        name.push('.' + layer.classes.split(' ').join(', .'));
      }
      li = $(this).data('li');
      $(li).find('label').text(name.join(', ')).end().data('tilemill', layer);
    }
    TileMill.popup.hide();
    return false;
  });

  $('div#header a.info').click(function() {
    $('#popup-info input#tilelive-url').val(TileMill.settings.tilelive.split(',')[0] + 'tile/' + TileMill.mml.url({ timestamp: false, encode: true }));
    $('#popup-info input#project-mml-url').val(TileMill.mml.url({ timestamp: false, encode: false }));
    TileMill.popup.show({content: $('#popup-info'), title: 'Info'});
    return false;
  });
};