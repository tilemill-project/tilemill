/**
 * Router controller: Project page.
 */
TileMill.controller.project = function() {
  var id = $.bbq.getState('id');
  TileMill.backend.get('project/' + id + '/' + id + '.mml', function(mml) {
    // Bail if MML was not valid.
    if (typeof mml != 'string') {
      TileMill.errorPage(mml.data);
      return false;
    }

    // Store current project data.
    TileMill.data.mml = mml;
    TileMill.data.id = id;
    TileMill.data.type = 'project';
    TileMill.data.filename = 'project/' + id + '/' + id + '.mml';

    // Set the unique query string.
    TileMill.data.uniq = (new Date().getTime());

    // Parse MML.
    var parsed = TileMill.mml.parseMML(mml);

    TileMill.show(TileMill.template('project', {id: id}));

    var layers = TileMill.mml.init();
    var inspector = TileMill.inspector.init();
    var stylesheets = TileMill.stylesheet.init();
    var map = TileMill.map.init();
    var color = TileMill.colors.init();

    $('#sidebar').append(layers);
    $('#sidebar').append(inspector);
    $('#sidebar').append(map).addClass('with-map');
    $('#main').append(stylesheets);
    $('#main').append(color);

    // Init elements which require DOM presence.
    TileMill.colors.initFarb(color);
    // TODO: actually configure map, don't pretend to
    TileMill.map.initOL(map, TileMill.backend.servers(TileMill.mml.url()), {
        navigation: 1,
        fullscreen: 1,
        zoom: 1,
        panzoombar: 0
    }, parsed.metadata.mapCenter);

    $('div#header a.save').click(function() {
      if ($(this).is('.changed')) {
        TileMill.project.save();
      }
      return false;
    });

    $('div#header a.info').click(function() {
      var tilelive_url = TileMill.backend.servers(TileMill.mml.url())[0] +
        'tile/' + TileMill.mml.url({ timestamp: false, encode: true });
      var mml_url = TileMill.mml.url({
          timestamp: false,
          encode: false
      });
      var popup = $(TileMill.template('popup-info-project', {
          tilelive_url: tilelive_url,
          mml_url: mml_url
      }));
      TileMill.popup.show({content: popup, title: 'Info'});
      return false;
    });

    $('div#header a.minimal').toggle(
        function() {
          $('#main').hide();
          $('#sidebar').css('width', '100%');
          TileMill.project_watcher = setInterval(TileMill.project.watch, 1000);
        },
        function() {
          $('#main').show();
          $('#sidebar').css('width', '30%');
          TileMill.project_watcher = null;
        }
    );

    $('div#header a.home').click(function() {
      if (!$('div#header a.save').is('.changed') ||
          confirm('You have unsaved changes. Are you sure you ' +
              'want to close this project?')) {
        return true;
      }
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

/**
 * Mark this project as changed (and needing to be saved).
 */
TileMill.project.changed = function() {
  $('div#header a.save').addClass('changed');
};

TileMill.project.checkStale = function(data) {
  $('#tabs a.tab').each(function() {
    if (($.url.setUrl($(this).data('tilemill').src).param('filename') == data.filename) &&
      ($(this).data('tilemill').mtime != data.mtime)) {
      TileMill.inspector.load();
      TileMill.data.uniq = (new Date().getTime());
      TileMill.map.reload($('#map-preview'), TileMill.backend.servers(TileMill.mml.url()));
      $('div#header a.save').removeClass('changed');
      $(this).data('tilemill').mtime = data.mtime;
    }
  });
};

TileMill.project.watch = function() {
  var id = TileMill.data.id,
      queue = new TileMill.queue();
  $('#tabs a.tab').each(function() {
    TileMill.stylesheet.setCode($('#tabs a.active'), true);
    TileMill.stylesheet.mtime(
      $.url.setUrl($(this).data('tilemill').src).param('filename'),
      TileMill.project.checkStale);
  });
};


/**
 * Save a project from its current DOM state.
 */
TileMill.project.save = function() {
  // Refresh storage of active stylesheet before saving.
  TileMill.stylesheet.setCode($('#tabs a.active'), true);

  var id = TileMill.data.id,
      queue = new TileMill.queue();
  queue.add(function(id, next) {
    var mml = {
      metadata: {},
      stylesheets: [],
      layers: []
    };

    // Retrieve map preview.
    mml.metadata.mapCenter = TileMill.map.getCenter($('#map-preview'));

    $('#tabs a.tab').each(function() {
      mml.stylesheets.push(
          TileMill.backend.url($.url.setUrl($(this).data('tilemill').src)
              .param('filename')) + '&c=' + TileMill.data.uniq);
      TileMill.stylesheet.save(
          $.url.setUrl($(this).data('tilemill').src).param('filename'),
          $('input', this).val());
    });
    $('#layers ul.sidebar-content li').reverse().each(function() {
      var layer = $(this).data('tilemill');
      if (layer) {
        layer.status = !!$(this).find('input[type=checkbox]').is(':checked');
        mml.layers.push(layer);
      }
    });
    mml = TileMill.mml.generate(mml);
    TileMill.backend.post('project/' + id + '/' + id + '.mml', mml, next);
  }, [id]);
  queue.add(function() {
    TileMill.inspector.load();
    TileMill.data.uniq = (new Date().getTime());
    TileMill.map.reload(
        $('#map-preview'),
        TileMill.backend.servers(TileMill.mml.url()));
    $('div#header a.save').removeClass('changed');
  });
  queue.execute();
};

/**
 * Add a new project.
 */
TileMill.project.add = function(name) {
  $('body').append(TileMill.template('loading', {}));

  var queue = new TileMill.queue();
  queue.add(function(name, next) {
    var self = this;
    TileMill.backend.list('project', function(projects) {
      if ($.inArray(name, projects) !== -1) {
        $('body div.loading').remove();
        TileMill.message('Error', 'A project with the name <em>' +
            name + '</em> already exists. Please choose another name.',
            'error');
        self.reset();
      }
      else {
        next();
      }
    });
  }, [name]);
  queue.add(function(name, next) {
    var mss = 'project/' + name + '/' + name + '.mss';
    var data = TileMill.mss.generate({
      'Map': {
        'map-bgcolor': '#fff'
      },
      '#world': {
        'polygon-fill': '#eee',
        'line-color': '#ccc',
        'line-width': '0.5'
      }
    });
    TileMill.backend.post(mss, data, next);
  }, [name]);
  queue.add(function(name, next) {
    var mss = 'project/' + name + '/' + name + '.mss';
    var mml = 'project/' + name + '/' + name + '.mml';
    var data = TileMill.mml.generate({
      stylesheets: [TileMill.backend.url(mss)],
      layers: [{
        id: 'world',
        srs: '&srsWGS84;',
        // TODO: make configurable
        file: 'http://cascadenik-sampledata.s3.amazonaws.com/world_borders.zip',
        type: 'shape'
      }]
    });
    TileMill.backend.post(mml, data, next);
  }, [name]);
  queue.add(function(name) {
    $.bbq.pushState({ 'action': 'project', 'id': name });
  }, [name]);
  queue.execute();
};
