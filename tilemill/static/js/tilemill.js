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

TileMill.save = function() {
  var mml = TileMill.mml.save();

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

$(function() {
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
    TileMill.mml.add({
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
      TileMill.mml.add(layer);
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
