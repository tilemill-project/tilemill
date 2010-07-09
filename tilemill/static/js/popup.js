TileMill.popup = {};

TileMill.popup.show = function(options) {
  if ($('body #popup').size()) {
    TileMill.popup.hide();
  }
  var popup = $(TileMill.template('popup', {
    'title': options.title,
    'content': TileMill.template('popup-' + (options.type ? options.type : 'standard'), options),
  }));
  popup.find('a.popup-close').bind('click', TileMill.popup.hide);
  $('body').append(popup);
};

TileMill.popup.hide = function() {
  if ($('body #popup').size()) {
    $('body #popup').remove();
  }
};
