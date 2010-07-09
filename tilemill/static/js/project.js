TileMill.controller.project = function() {
  var id = $.bbq.getState("id");
  TileMill.backend.file('project/' + id + '/' + id + '.mml', function(mml) {
    TileMill.settings.mml = mml;
    TileMill.settings.filename = 'project/' + id + '/' + id + '.mml';
    TileMill.show(TileMill.template('project', {id: id}));
    for (var i in TileMill.editor) {
      TileMill.editor[i]();
    }
  });
};
