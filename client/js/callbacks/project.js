TileMill.controller.project = function() {
  var id = $.bbq.getState("id");
  TileMill.backend.get('project/' + id + '/' + id + '.mml', function(mml) {

    // Store current settings. @TODO: Refactor this.
    TileMill.settings.mml = mml;
    TileMill.settings.id = id;
    TileMill.settings.type = 'project';
    TileMill.settings.filename = 'project/' + id + '/' + id + '.mml';

    // Set the unique query string.
    TileMill.uniq = (new Date().getTime());

    TileMill.show(TileMill.template('project', {id: id}));

    for (var i in TileMill.editor) {
      TileMill.editor[i]();
    }

    var layers = TileMill.mml.init();
    var inspector = TileMill.inspector.init();
    var stylesheets = TileMill.stylesheet.init();
    var map = TileMill.map.init();
    var color = TileMill.colors.init();

    $('#sidebar').append(layers);
    $('#sidebar').append(inspector);
    $('body').append(map);
    $('body').append(stylesheets);
    $('body').append(color);

    // Farbtastic needs to be inited after the element is added to the DOM.
    TileMill.colors.initFarb(color);
    TileMill.map.initOL(map, TileMill.backend.servers(TileMill.mml.url()), {navigation: 1, fullscreen: 1, zoom: 1, panzoombar: 0});

    $('div#header a.save').click(function() {
      TileMill.project.save();
      return false;
    });

    $('div#header a.info').click(function() {
      var tilelive_url = TileMill.backend.servers(TileMill.mml.url())[0] + 'tile/' + TileMill.mml.url({ timestamp: false, encode: true });
      var mml_url = TileMill.mml.url({ timestamp: false, encode: false });
      var popup = $(TileMill.template('popup-info', {tilelive_url: tilelive_url, mml_url: mml_url}));
      TileMill.popup.show({content: popup, title: 'Info'});
      return false;
    });

    // Hide inspector to start.
    inspector.hide();
    $('a.inspector-close').click(function() {
      $('#layers').show();
      $('#inspector').hide();
      return false;
    });
  });
};

TileMill.project = {};

TileMill.project.save = function() {
  // Refresh storage of active stylesheet before saving.
  TileMill.stylesheet.setCode($('#tabs a.active'), true);

  var id = $.bbq.getState("id"), queue = new TileMill.queue();
  queue.add(function(id, next) {
    // Save MML and MSS files.
    var mml = { stylesheets: [], layers: [] };
    $('#tabs a.tab').each(function() {
      mml.stylesheets.push(TileMill.backend.url($.url.setUrl($(this).data('tilemill')['src']).param('filename')) + '&amp;c=' + TileMill.uniq);
      TileMill.stylesheet.save($.url.setUrl($(this).data('tilemill')['src']).param('filename'), $('input', this).val());
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
    TileMill.map.reload($('#map-preview'), TileMill.backend.servers(TileMill.mml.url()));
  });
  queue.execute();
}

TileMill.project.add = function(name) {
  var project_mml = "<?xml version='1.0' encoding='utf-8'?>\n\
<!DOCTYPE Map[\n\
  <!ENTITY srs900913 '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs'>\n\
  <!ENTITY srsWGS84 '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs'>\n\
]>\n\
<Map srs='&srs900913;'>\n\
  <Stylesheet src='{{ stylesheet }}' />\n\
  <Layer id='world' srs='&srsWGS84;'>\n\
    <Datasource>\n\
      <Parameter name='file'>http://cascadenik-sampledata.s3.amazonaws.com/world_borders.zip</Parameter>\n\
      <Parameter name='type'>shape</Parameter>\n\
    </Datasource>\n\
  </Layer>\n\
</Map>";
  var project_mss = "Map {\n\
  map-bgcolor: #fff;\n\
}";

  var queue = new TileMill.queue();
  queue.add(function(name, next) {
    var filename = 'project/' + name;
    TileMill.backend.add(filename, next);
  }, [name]);
  queue.add(function(name, next) {
    var mss = 'project/' + name + '/' + name + '.mss';
    var data = project_mss;
    TileMill.backend.post(mss, data, next);
  }, [name]);
  queue.add(function(name, next) {
    var mss = 'project/' + name + '/' + name + '.mss';
    var mml = 'project/' + name + '/' + name + '.mml';
    var data = project_mml.replace('{{ stylesheet }}', TileMill.backend.url(mss));
    TileMill.backend.post(mml, data, next);
  }, [name]);
  queue.add(function(name) {
    $.bbq.pushState({ 'action': 'project', 'id': name });
  }, [name]);
  queue.execute();
};
