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

  TileMill.inspector.load();
  TileMill.uniq = (new Date().getTime());
  TileMill.map.reload();
}

$(function() {
  $('a.inspector-close').click(function() {
    $('#layers').show();
    $('#inspector').hide();
    return false;
  });

  $('a#popup-close').click(function() {
    $('#popup, #popup > div, #popup-backdrop, #popup-header').hide();
    $('#popup-layer').removeClass('new');
  });

  $('div#header a.save').click(function() {
    TileMill.save();
    return false;
  });

  $('div#header a.info').click(function() {
    $('#popup > div').hide();
    $('#popup, #popup-info, #popup-backdrop, #popup-header').show();
    $('#popup-header h2').text('Info');
    $('#popup-info input#tilelive-url').val(TileMill.settings.tilelive + 'tile/' + TileMill.mml.url({ timestamp: false, encode: true }));
    $('#popup-info input#project-mml-url').val(TileMill.mml.url({ timestamp: false, encode: false }));
    return false;
  });
});
