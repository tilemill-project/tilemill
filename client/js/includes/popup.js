/**
 * Simple popup API.
 */
TileMill.popup = {};

TileMill.popup.show = function(options) {
  if ($('body #popup').size()) {
    TileMill.popup.hide();
  }
  var popup = $(ich.popup({title: options.title}));
  $('.popup-content', popup).append(options.content);
  popup.find('a.popup-close').bind('click', TileMill.popup.hide);
  $('body').append(popup);
};

TileMill.popup.hide = function() {
  if ($('body #popup').size()) {
    $('body #popup').remove();
  }
  return false;
};
