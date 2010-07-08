var TileMill = TileMill || { settings:{}, page:0, uniq: (new Date().getTime()), customSrs: [], url: '', editor: {} };
$.fn.reverse = [].reverse;

TileMill.save = function() {
  var mml = TileMill.mml.save(TileMill.mml.generate());

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
  $('div#header a.save').click(function() {
    TileMill.save();
    return false;
  });

  $('div#header a.info').click(function() {
    $('#popup-info input#tilelive-url').val(TileMill.settings.tilelive + 'tile/' + TileMill.mml.url({ timestamp: false, encode: true }));
    $('#popup-info input#project-mml-url').val(TileMill.mml.url({ timestamp: false, encode: false }));
    TileMill.popup.show({content: $('#popup-info'), title: 'Info'});
    return false;
  });

  for (var i in TileMill.editor) {
    TileMill.editor[i]();
  }
});
