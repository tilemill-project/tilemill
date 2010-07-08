TileMill.popup = {};

TileMill.popup.show = function(options) {
  TileMill.popup.target = $('body');
  if ($('.popup', TileMill.popup.target).size()) {
    TileMill.popup.hide();
  }
  var popup = $('<div class="popup"><div class="popup-header clearfix pane"></div><div class="popup-content"></div></div>');
  $('.popup-header', popup)
    .append('<h2>'+ options.title +'</h2>')
    .append($('<a href="#" class="popup-close">Close</a>').click(function() {
      TileMill.popup.hide();
    }));
  $('.popup-content', popup).append(options.content);
  TileMill.popup.target.append('<div class="popup-backdrop"></div>').append(popup);
};

TileMill.popup.hide = function() {
  if ($('.popup', TileMill.popup.target).size()) {
    $('.popup .popup-content > *', TileMill.popup.target).appendTo('#popups');
    $('.popup, .popup-backdrop', TileMill.popup.target).remove();
  }
};
