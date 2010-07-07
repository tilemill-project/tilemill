TileMill.mml = {};

TileMill.mml.add = function(options) {
  var layerName = '';
  if (options.id) {
    layerName = '#' + options.id + ' ';
  }
  if (options.classes.length) {
    layerName += '.' + options.classes.join(', .');
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
      TileMill.inspect($(this).parents('li').data('tilemill').id);
      TileMill.page = 0;
      return false;
    }))
    .append($('<a class="layer-edit" href="#">Edit</a>').click(function() {
      var options = $(this).parents('li').data('tilemill');
      $('#popup, #popup-layer, #popup-backdrop, #popup-header').show().removeClass('new');
      var layer = $('#popup-layer').find('input.submit').val('Save').data('li', $(this).parents('li')).end();

      options.classes = options.classes.join(' ');
      for (option in options) {
        layer.find('#' + option).val(options[option]).end();
      }

      $('#popup-header h2').text('Edit layer');
      $('#popup-info').hide();
      return false;
    }))
    .append($('<label>' + layerName + '</label>'));
  if (options.status == 'true' || options.status == true) {
    checkbox[0].checked = true;
  }
  $('#layers ul.sidebar-content').prepend(li.data('tilemill', options));
};

TileMill.mml.generate = function() {
  var output = ['<' + '?xml version="1.0" encoding="utf-8"?>',
  '<!DOCTYPE Map[',
  '  <!ENTITY srs900913 "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs">',
  '  <!ENTITY srsWGS84 "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs">',
  ']>',
  '<Map srs="&srs900913;">'];
  // @TODO refactor this out.
  $('#tabs a.tab').each(function() {
    var url = $.url.setUrl($(this).data('tilemill')['src']);
    output.push('  <Stylesheet src="' + TileMill.settings.server + 'projects/mss?id='+ url.param('id') +'&amp;filename='+ url.param('filename') +'&amp;c=' + TileMill.uniq + '" />');
  });

  $('#layers ul.sidebar-content li').reverse().each(function() {
    var layer = $(this).data('tilemill'), l = '  <Layer';
    if (layer.id) {
      l += ' id="' + layer.id + '"';
    }
    if (layer.classes) {
      l += ' class="' + layer.classes.join(' ') + '"';
    }
    if (!layer.srs) {
      layer.srs = '900913';
    }
    if (layer.srs == '900913' || layer.srs == 'WGS84') {
      layer.srs = '&srs' + layer.srs + ';';
    }
    l += ' srs="' + layer.srs + '"';
    if (!$(this).attr('checked') == 'checked') {
      l += ' status="off"';
    }
    l += '>';
    output.push(l);
    output.push('    <Datasource>');
    output.push('      <Parameter name="file">' + $('<span/>').text(layer.dataSource).html() + '</Parameter>');
    output.push('      <Parameter name="type">shape</Parameter>');
    if (layer.id) {
      output.push('      <Parameter name="id">' + layer.id + '</Parameter>');
    }
    output.push('    </Datasource>');
    output.push('  </Layer>');
  });
  output.push('</Map>');
  return output.join("\n");
};

TileMill.mml.save = function() {
  $.post('/projects/mml', {
    'id': TileMill.settings.project_id,
    'data': TileMill.mml.generate(),
  });
};
