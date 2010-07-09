$.fn.reverse = [].reverse;

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

    $('div#header a.save').click(function() {
      TileMill.project.save();
      return false;
    });

  });
};

TileMill.project = {};

TileMill.project.save = function() {
  var id = $.bbq.getState("id"), queue = new TileMill.queue();
  queue.add(function(id, next) {
    // Save MML file.
    var mml = { stylesheets: [], layers: [] };
    $('#tabs a.tab').each(function() {
      mml.stylesheets.push(TileMill.backend.url($.url.setUrl($(this).data('tilemill')['src']).param('filename')) + '&amp;c=' + TileMill.uniq);
    });
    $('#layers ul.sidebar-content li').reverse().each(function() {
      var layer = $(this).data('tilemill');
      layer.file = $('<span/>').text(layer.dataSource).html();
      layer.status = !!$(this).find('input[type=checkbox]').is(':checked');
      mml.layers.push(layer);
    });
    mml = TileMill.mml.generate(mml);
    TileMill.backend.post('project/' + id + '/' + id + '.mml', mml, next);
  }, [id]);
  queue.add(function() {
    TileMill.inspector.load();
    TileMill.uniq = (new Date().getTime());
    TileMill.map.reload();
  });
  queue.execute();
}
