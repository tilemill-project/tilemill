var TileMill = TileMill || { settings:{}, page:0, uniq: (new Date().getTime()), customSrs: [], url: '' };
$.fn.reverse = [].reverse;

TileMill.save = function() {
  var mml = TileMill.mml.save();

  // Make sure latest edits to active tab's text have been recorded.
  $('#tabs a.active input').val(TileMill.mirror.getCode());
  $('#tabs a.tab').each(function() {
    var url = $.url.setUrl($(this).data('tilemill')['src']);
    TileMill.stylesheet.save(url.param('filename'), $('input', this).val());
  });

  TileMill.loadInspection();
  TileMill.uniq = (new Date().getTime());
  TileMill.map.reload();
}

$(function() {
  $('a.inspector-close').click(function() {
    $('#layers').show();
    $('#inspector').hide();
    return false;
  });

  TileMill.loadInspection(true);

  $('a#popup-close').click(function() {
    $('#popup, #popup > div, #popup-backdrop, #popup-header').hide();
    $('#popup-layer').removeClass('new');
  });

  $('div#header a.save').click(function() {
    TileMill.save();
    return false;
  });

  $('#tabs a.tab-add').click(function() {
    $('#popup, #popup-stylesheet, #popup-backdrop, #popup-header').show();
    $('#popup-stylesheet input:not(.submit)').val('');
    $('#popup-header h2').text('Add stylesheet');
    $('#popup-info').hide();
    return false;
  });

  $('#popup-stylesheet input.submit').click(function() {
    TileMill.stylesheet.add({src: $('#popup-stylesheet input#stylesheet-name').val(), create: true});
    $('#popup, #popup > div, #popup-backdrop, #popup-header').hide();
    return false;
  });

  $('div#header a.info').click(function() {
    $('#popup, #popup-info, #popup-backdrop, #popup-header').show();
    $('#popup-header h2').text('Info');
    $('#popup-info input#tilelive-url').val(TileMill.settings.tilelive + 'tile/' + TileMill.mml.url({ timestamp: false, encode: true }));
    $('#popup-info input#project-mml-url').val(TileMill.mml.url({ timestamp: false, encode: false }));
    $('#popup-layer').hide();
    return false;
  });
});
