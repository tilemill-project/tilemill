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
    .append($('<input type="checkbox" />').attr('checked', status ? 'checked' : ''))
    .append(layerName)
    .append($('<a class="layer-edit" href="#">Edit</a>'))
    .append($('<a class="layer-inspect" href="#">Inspect</a>'))
    .appendTo($('#layers ul.sidebar-content'));
};

$(function() {
  $(mml).find('Layer').each(function() {
    status = $(this).attr('status') == 'on';
    TileMill.addLayer($(this).attr('class').split(' '), $(this).attr('id'), !status || $(this).attr('status') == 'on');
  });

  $('a.layer-inspect').click(function() {
    $('#layers').hide();
    $('#inspector').show();
  });

  $('a.inspector-close').click(function() {
    $('#layers').show();
    $('#inspector').hide();
  });
});