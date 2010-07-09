var TileMill = {
  editor: {},
  settings: {
    server: 'python',
    rasterizer: 'tilelive',
    pythonServer: 'http://localhost:8889/',
    tileliveServer: 'http://localhost:8888/',
  },
};

// Controller.

TileMill.controller = { arguments: {} };

TileMill.controller.route = function() {
  var url = $.bbq.getState("action");
  switch (url) {
    case undefined:
    case 'list':
      fn = 'list';
      break;
    case 'project':
      fn = 'project';
      break;
    case 'visualization':
      fn = 'visualization';
      break;
  }
  $('body').attr('id', fn).empty().append('<div class="loading"></div>');
  TileMill.controller[fn]();
};

TileMill.show = function(data) {
  $('body').empty().append(data);
}

$(function() {
  // Just show a quick swirly while everything is loading.
  $(window).bind('resize', function() {
    if ($('.loading').size()) {
      $('.loading').css('margin-top', (window.innerHeight - 32)/2);
    }
  }).trigger('resize');


  $(window).bind("hashchange", function() {
    TileMill.controller.route();
  }).trigger('hashchange');

  /*
  $('div#header a.save').click(function() {
    TileMill.save();
    return false;
  });

  $('div#header a.info').click(function() {
    $('#popup-info input#tilelive-url').val(TileMill.settings.tilelive.split(',')[0] + 'tile/' + TileMill.mml.url({ timestamp: false, encode: true }));
    $('#popup-info input#project-mml-url').val(TileMill.mml.url({ timestamp: false, encode: false }));
    TileMill.popup.show({content: $('#popup-info'), title: 'Info'});
    return false;
  });
  */
});
