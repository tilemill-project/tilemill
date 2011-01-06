var Project = Backbone.Model.extend({
    SRS_DEFAULT: '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs',
    initialize: function() {
        var self = this;
        // Set default values.
        if (!this.get('srs')) {
            this.set({'srs': this.SRS_DEFAULT});
        }
        if (!this.get('Stylesheet')) {
            this.set({'Stylesheet': new StylesheetList([], {parent:this})});
            this.get('Stylesheet').bind('all', function() { self.save(); });
        }
        if (!this.get('Layer')) {
            this.set({'Layer': new LayerList([], {parent:this})});
            this.get('Layer').bind('all', function() { self.save(); });
        }
    },
    parse: function(response) {
        var self = this;
        // Instantiate StylesheetList and LayerList collections from JSON lists
        // of plain JSON objects.
        response.Stylesheet = new StylesheetList(response.Stylesheet ? response.Stylesheet : [], {parent:this});
        response.Stylesheet.bind('all', function() { self.save(); });
        response.Layer = new LayerList(response.Layer ? response.Layer : [], {parent:this});
        response.Layer.bind('all', function() { self.save(); });
        return response;
    },
    // Override url() method for convenience so we don't always need a
    // collection reference around for CRUD operations on a single model.
    url: function() {
        return '/api/project/' + this.id;
    },
    /**
     * Layer URL based on the model URL.
     */
    layerURL: function() {
        var mmlb64 = Base64.urlsafe_encode(window.location.origin + this.url());
        return window.location.origin + '/tile/' + mmlb64 + '/${z}/${x}/${y}.png'
    },
    validate: function(attributes) {
        // Trigger a validation event.
        this.trigger('validate');

        if (/^[a-z0-9\-_]+$/i.test(this.id) === false) {
            return 'Name must contain only letters, numbers, dashes, and underscores.';
        }
    }
});

var ProjectList = Backbone.Collection.extend({
    model: Project,
    url: '/api/project'
});

var ProjectListView = Backbone.View.extend({
    id: 'ProjectListView',
    tagName: 'div',
    className: 'column',
    initialize: function() {
        _.bindAll(this, 'render');
        this.collection.bind('all', this.render);
        this.collection.fetch();
    },
    render: function() {
        var self = this;
        $(this.el).html(ich.ProjectListView());
        this.collection.each(function(project) {
            var projectRow = new ProjectRowView({
                model: project,
                collection: this.collection
            });
            $('ul', self.el).append(projectRow.el);
        });
        return this;
    },
    events: {
        'click input.submit': 'add'
    },
    add: function() {
        // @TODO: this code is considerably more complicated than it should be
        // because this.collection.create() does not appear to stop itself from
        // saving a project even if its validation fails.
        // See: https://github.com/documentcloud/backbone/issues#issue/66
        window.app.loading();
        var projectId = $('input.text', this.el).val();
        var project = new Project({id: projectId});
        var self = this;
        project.save(project, {
            success: function() {
                self.collection.add(project);
                window.app.done();
            },
            error: function(project, error) {
                window.app.done();
                window.app.message('Error', error);
            }
        });
        return false;
    }
});

var ProjectRowView = Backbone.View.extend({
    tagName: 'li',
    className: 'clearfix',
    initialize: function () {
        _.bindAll(this, 'render');
        this.render();
    },
    render: function () {
        $(this.el).html(ich.ProjectRowView(this.model));
        return this;
    },
    events: {
        'click .file-delete': 'delete'
    },
    delete: function() {
        window.app.loading();
        if (confirm('Are you sure you want to delete this project?')) {
            this.model.destroy({
                success: function() {
                    window.app.done();
                },
                error: function() {
                    window.app.done();
                    window.app.message('Error', 'The project could not be deleted.');
                }
            });
        }
        else {
            window.app.done();
        }
        return false;
    }
});

var ProjectView = Backbone.View.extend({
    events: {
        'click div#header a.save': 'saveProject',
        'click div#header a.info': 'projectInfo',
        'click div#header a.minimal': 'minimal',
        'click div#header a.home': 'home'
    },
    initialize: function () {
        _.bindAll(this, 'render');
        this.model.fetch({
            success: this.render,
            error: this.render
        });
    },
    render: function() {
        $(this.el).html(ich.ProjectView(this.model));

        var layers = new LayerListView({collection: this.model.get('Layer')});
        var stylesheets = new StylesheetListView({collection: this.model.get('Stylesheet')});
        var map = new MapView({model: this.model});

        $('#sidebar', this.el).append(layers.el);
        $('#sidebar', this.el).append(map.el);
        $('#main', this.el).append(stylesheets.el);
        window.app.el.html(this.el);
        return this;
    },
    saveProject: function() {
        this.model.save();
        return false;
    },
    projectInfo: function() {
        window.app.message('Project Info', {'tilelive_url': this.model.layerURL(), 'mml_url': window.location.origin + this.model.url()}, 'projectInfo');
        return false;
    },
    home: function() {
        return (!$('div#header a.save', this.el).is('.changed') || confirm('You have unsaved changes. Are you sure you want to close this project?'));
    },
    minimal: function() {
        $('a.minimal', this.el).toggleClass('active');
        if ($('a.minimal', this.el).is('.active')) {
            $('#main').hide();
            $('a.home').hide();
            $('a.save').hide();
            $('#sidebar').css('width', '100%');
            // @TODO.
            // TileMill.project_watcher = setInterval(TileMill.project.watch, 1000);
        }
        else {
            $('#main').show();
            $('a.home').show();
            $('a.save').show();
            $('#sidebar').css('width', '30%');
            // @TODO
            // window.clearInterval(TileMill.project_watcher);
        }
        return false;
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
