TileMill.popup = {};

TileMill.popup.show = function(options) {
  if ($('#editor .popup').size()) {
    TileMill.popup.hide();
  }
  var popup = $('<div class="popup"><div class="popup-header clearfix pane"></div><div class="popup-content"></div></div>');
  $('.popup-header', popup)
    .append('<h2>'+ options.title +'</h2>')
    .append($('<a href="#" class="popup-close">Close</a>').click(function() {
      TileMill.popup.hide();
    }));
  $('.popup-content', popup).append(options.content);
  $('#editor').append('<div class="popup-backdrop"></div>').append(popup);
};

TileMill.popup.hide = function() {
  if ($('#editor .popup').size()) {
    $('#editor .popup .popup-content > *').appendTo('#popups');
    $('#editor .popup, #editor .popup-backdrop').remove();
  }
};
