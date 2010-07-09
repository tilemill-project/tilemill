TileMill.controller.project = function() {
  var id = $.bbq.getState("id");
  TileMill.backend.get('project/' + id + '/' + id + '.mml', function(mml) {

    // Store current settings. @TODO: Refactor this.
    TileMill.settings.mml = mml;
    TileMill.settings.id = id;
    TileMill.settings.type = 'project';
    TileMill.settings.filename = 'project/' + id + '/' + id + '.mml';

    TileMill.show(TileMill.template('project', {id: id}));
    for (var i in TileMill.editor) {
      TileMill.editor[i]();
    }

    TileMill.map.init($('#map-preview'), TileMill.backend.servers(TileMill.mml.url()), {navigation: 1, fullscreen: 1, zoom: 1, panzoombar: 0});
  });
};
