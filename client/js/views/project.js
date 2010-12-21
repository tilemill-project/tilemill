var TMProjectView = Backbone.View.extend({
  events: {
    'div#header a.save': 'saveProject',
    'div#header a.info': 'projectInfo'
  },
  
  saveProject: function() {
    if ($(this).is('.changed')) {
      TileMill.project.save();
    }
    return false;
  },
  
  projectInfo: function() {
    TileMill.popup.show({
        content: $(ich.popup_info_project({
            tilelive_url: TileMill.backend.servers(TileMill.mml.url()),
            mml_url: TileMill.mml.url({
                timestamp: false,
                encode: false
            })
        })),
        title: 'Info'
    });
    return false;
  },
  
  render: function() {
    $(this.el).html('test');
    return this;
  }
});

/**
 * Router controller: Project page.
TileMill.bind('project', function() {
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

    TileMill.show(ich.project({id: id}));

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



    $(document).bind('keypress', function(event) {
      if (event.charCode == 19) {
        TileMill.project.save();
        return false;
      }
    });


    $('div#header a.minimal').toggle(
        function() {
          $('#main').hide();
          $('a.home').hide();
          $('a.save').hide();
          $('#sidebar').css('width', '100%');
          TileMill.project_watcher = setInterval(TileMill.project.watch, 1000);
        },
        function() {
          $('#main').show();
          $('a.home').show();
          $('a.save').show();
          $('#sidebar').css('width', '30%');
          window.clearInterval(TileMill.project_watcher);
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

    setInterval(TileMill.project.status, 10000);
  });
});

// TileMill.project = {};

/**
 * Mark this project as changed (and needing to be saved).
TileMill.project.changed = function() {
  $('div#header a.save').addClass('changed');
};

TileMill.project.checkStale = function(data) {
  $('#tabs a.tab').each(function() {
    if (($.url.setUrl($(this).data('tilemill').src)
            .param('filename') == data.filename) &&
      ($(this).data('tilemill').mtime != data.mtime)) {
      TileMill.inspector.load();
      TileMill.data.uniq = (new Date().getTime());
      TileMill.map.reload(
          $('#map-preview'),
          TileMill.backend.servers(TileMill.mml.url()));
      $('div#header a.save').removeClass('changed');
      $(this).data('tilemill').mtime = data.mtime;
    }
  });
};

TileMill.project.status = function() {
  TileMill.backend.status(function(status) {
    if (status) {
        $('.status').removeClass('offline');
    } else {
        $('.status').text('tile server offline');
        $('.status').addClass('offline');
    }
  });
};

TileMill.project.watch = function() {
  $('#tabs a.tab').each(function() {
    TileMill.stylesheet.setCode($('#tabs a.active'), true);
    TileMill.stylesheet.mtime(
      $.url.setUrl($(this).data('tilemill').src).param('filename'),
      TileMill.project.checkStale);
  });
};

/**
 * Save a project from its current DOM state.
TileMill.project.save = function() {
  // Refresh storage of active stylesheet before saving.
  TileMill.stylesheet.setCode($('#tabs a.active'), true);

  var id = TileMill.data.id,
      queue = new TileMill.queue();
  queue.add(function(id, next) {
    var mml = {
      metadata: {
        mapCenter: TileMill.map.getCenter($('#map-preview'))
      },
      stylesheets: [],
      layers: []
    };

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
TileMill.project.add = function(name) {
  $('body').append(ich.loading({}));

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
    TileMill.backend.post('project/' + name + '/' + name + '.mss',
      TileMill.mss.generate({
        'Map': {
          'map-bgcolor': '#fff'
        },
        '#world': {
          'polygon-fill': '#eee',
          'line-color': '#ccc',
          'line-width': '0.5'
        }
      }),
      next);
  }, [name]);
  queue.add(function(name, next) {
    var mss = 'project/' + name + '/' + name + '.mss';
    var mml = 'project/' + name + '/' + name + '.mml';
    var data = TileMill.mml.generate({
      stylesheets: [TileMill.backend.url(mss)],
      layers: [{
        id: 'world',
        srs: '&srs900913;',
        // TODO: make configurable
        file: 'http://tilemill-data.s3.amazonaws.com/world_borders_merc.zip',
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
*/
