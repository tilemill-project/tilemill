var TileMill = TileMill || { settings:{}, page:0, uniq: (new Date().getTime()), customSrs: [], url: '' };
$.fn.reverse = [].reverse;

/**
 * Generate the URL of the current project .mml file.
 */
TileMill.mmlURL = function(options) {
  if (!options) {
    var options = {};
  }
  $.extend(options, { timestamp: true, encode: true });
  var url = TileMill.settings.server + 'projects/mml?id=' + TileMill.settings.project_id;
  if (options.timestamp) {
    url += '&c=' + TileMill.uniq;
  }
  if (options.encode) {
    url = Base64.encode(url);
  }
  return url;
};

TileMill.addStylesheet = function(options) {
  // If there is no / character, assume this is a single filename.
  if (options.src.split('/').length === 1) {
    var filename = options.src.split('.')[0];
    options.src = TileMill.settings.server + 'projects/mss?id='+ TileMill.settings.project_id +'&filename='+ filename;
  }
  // Otherwise, assume this is a URL.
  else {
    var filename = $.url.setUrl(options.src).param('filename');
  }
  $.get(options.src, function(data) {
    var stylesheet = $('<a class="tab" href="#tab">')
      .text(filename)
      .data('tilemill', options)
      .append($('<input type="hidden">').val(data))
      .append($('<span class="tab-delete">Delete</span>').click(function() {
        if (confirm('Are you sure you want to delete this stylesheet?')) {
          $(this).parents('a.tab').hide('fast', function() {
            $(this).remove();
            // Set the first stylesheet to active.
            TileMill.initCodeEditor($('#tabs a.tab').eq(0), true);
          });
        }
        return false;
      }))
      .click(function() {
        TileMill.initCodeEditor($(this), true);
        return false;
      });
    $('#tabs').append(stylesheet);

    // If a position is defined we are adding stylesheets sequentially. Call
    // the for the addition of the next stylesheet.
    if (typeof options.position !== 'undefined') {
      TileMill.initCodeEditor(stylesheet);
      $('Stylesheet', TileMill.settings.mml).eq(options.position + 1).each(function() {
        if ($(this).attr('src')) {
          TileMill.addStylesheet({src: $(this).attr('src'), position: options.position + 1});
        }
      });
      // If this is the last stylesheet, do final processing.
      if (!$('Stylesheet', TileMill.settings.mml).eq(options.position + 1).size()) {
      }
    }
  });
};

TileMill.save = function(map) {
  var mml = TileMill.mml();
  $.post('/projects/mml', {
    'id': TileMill.settings.project_id,
    'data': mml,
  });

  // Make sure latest edits to active tab's text have been recorded.
  $('#tabs a.active input').val(TileMill.mirror.getCode());
  $('#tabs a.tab').each(function() {
    var url = $.url.setUrl($(this).data('tilemill')['src']);
    TileMill.mssSave(url.param('filename'), $('input', this).val());
  });

  TileMill.loadInspection();
  TileMill.uniq = (new Date().getTime());
  TileMill.initMap();
}

TileMill.mml = function() {
  var output = ['<' + '?xml version="1.0" encoding="utf-8"?>',
  '<!DOCTYPE Map[',
  '  <!ENTITY srs900913 "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs">',
  '  <!ENTITY srsWGS84 "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs">',
  ']>',
  '<Map srs="&srs900913;">'];
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
    l += ' srs="' + $('<span/>').text(layer.srs).html() + '"';
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
}

TileMill.mssSave = function(file, data) {
  $.post('/projects/mss', {'id': TileMill.settings.project_id, 'filename': file, 'data': data });
}

$(function() {
  $('Stylesheet:first', TileMill.settings.mml).each(function() {
    if ($(this).attr('src')) {
      TileMill.addStylesheet({src: $(this).attr('src'), position: 0});
    }
  });
  $(TileMill.settings.mml).find('Layer').each(function() {
    var status = $(this).attr('status');
    if (status == 'undefined' || status == undefined || status == 'on') {
      status = true;
    }
    else {
      status = false;
    }
    var classes = []
    if ($(this).attr('class')) {
      classes = $(this).attr('class').split(' ');
    }
    var srs = $(this).attr('srs'), parsed_srs = srs.replace(/^&srs(.*);$/, '$1');
    if (parsed_srs == srs) {
      var pass = false;
      for (var key in TileMill.customSrs) {
        if (TileMill.customSrs[key] == srs) {
          pass = true;
        }
      }
      if (!pass) {
        TileMill.customSrs.push(srs);
      }
    }
    else {
      srs = parsed_srs;
    }
    TileMill.addLayer({
      classes: classes,
      id: $(this).attr('id'),
      status: status,
      dataSource: $(this).find('Datasource Parameter[name=file]').text(),
      srs: srs
    });
  });
  for (var i in TileMill.customSrs) {
    var srs = TileMill.customSrs[i];
    if (srs.length > 23) {
      srs = srs.substr(0, 20) + '...';
    }
    $('select#srs').append('<option value="' + TileMill.customSrs[i].replace('"', '\\"') + '">' + srs + "</option>");
  }

  $('#layers ul.sidebar-content').sortable({ axis: 'y', handle: 'div.handle' });
  $('#tabs').sortable({ axis: 'x', });

  $('a.inspector-close').click(function() {
    $('#layers').show();
    $('#inspector').hide();
    return false;
  });

  TileMill.loadInspection(true);

  $('a#layers-add').click(function() {
    $('#popup, #popup-layer, #popup-backdrop, #popup-header').show();
    $('#popup-layer input:not(.submit)').val('');
    $('#popup-layer').addClass('new');
    $('#popup-layer input.submit').text('Add layer');
    $('#popup-header h2').text('Add layer');
    $('#popup-info').hide();
    return false;
  });

  $('#popup-layer input.submit').click(function() {
    var layer = {
      classes: $('#popup-layer input#classes').val().split(' '),
      id: $('#popup-layer input#id').val(),
      dataSource: $('#popup-layer input#dataSource').val(),
      srs: $('#popup-layer select#srs').val(),
      status: 'true'
    };
    if ($('#popup-layer').is('.new')) {
      TileMill.addLayer(layer);
    }
    else {
      var layerName = '';
      if (layer.id) {
        layerName = '#' + layer.id + ' ';
      }
      if (layer.classes) {
        layerName += '.' + layer.classes.join(', .');
      }
      li = $(this).data('li');
      $(li).find('label').text(layerName).end().data('tilemill', layer);
    }
    $('#popup, #popup > div, #popup-backdrop, #popup-header').hide();
    $('#popup-layer').removeClass('new');
    return false;
  })

  $('a#popup-close').click(function() {
    $('#popup, #popup > div, #popup-backdrop, #popup-header').hide();
    $('#popup-layer').removeClass('new');
  });

  $('div#header a.save').click(function() {
    TileMill.save();
    return false;
  });

  $('div#header a.info').click(function() {
    $('#popup, #popup-info, #popup-backdrop, #popup-header').show();
    $('#popup-header h2').text('Info');
    $('#popup-info input#tilelive-url').val(TileMill.settings.tilelive + 'tile/' + TileMill.mmlURL({timestamp:false, encode:true}));
    $('#popup-info input#project-mml-url').val(TileMill.mmlURL({timestamp:false, encode:false}));
    $('#popup-layer').hide();
    return false;
  });
});
