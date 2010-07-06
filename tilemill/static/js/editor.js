jQuery.fn.reverse = [].reverse;

TileMill = {};
TileMill.addLayer = function(classes, id, status) {
  var layerName = '';
  if (id) {
    layerName = '#' + id + ' ';
  }
  if (classes) {
    layerName += '.' + classes.join(', .');
  }
  $('<li>')
    .append($('<input class="checkbox" type="checkbox" />').attr('checked', status ? 'checked' : ''))
    .append($('<a class="layer-inspect" href="#">Inspect</a>').click(function() {
      $('#layers').hide();
      $('#inspector').show();
      return false;
    }))
    .append($('<a class="layer-edit" href="#">Edit</a>'))
    .append($('<label>' + layerName + '</label>'))
    .appendTo($('#layers ul.sidebar-content'));
};

$(function() {
  $(mml).find('Layer').reverse().each(function() {
    status = $(this).attr('status');
    TileMill.addLayer($(this).attr('class').split(' '), $(this).attr('id'), !status || $(this).attr('status') == 'on');
  });

  $('a.inspector-close').click(function() {
    $('#layers').show();
    $('#inspector').hide();
    return false;
  });
});