var Project = Backbone.Model.extend({
    SRS_DEFAULT: '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs',
    STYLESHEET_DEFAULT: [{
        id: 'style.mss',
        data: "#world {\n  polygon-fill: #eee;\n  line-color: #ccc;\n  line-width: 0.5;\n}"
    }],
    LAYER_DEFAULT: [{
        id: 'world',
        srs: '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs',
        Datasource: {
            file: 'http://tilemill-data.s3.amazonaws.com/world_borders_merc.zip',
            type: 'shape',
            estimate_extent: 'true',
            id: 'world',
        }
    }],
    initialize: function(attributes) {
        if (!this.get('srs')) {
            this.set({'srs': this.SRS_DEFAULT});
        }
        if (!this.get('Stylesheet')) {
            this.set({'Stylesheet': new StylesheetList(this.STYLESHEET_DEFAULT, { parent: this })});
        }
        if (!this.get('Layer')) {
            this.set({'Layer': new LayerList(this.LAYER_DEFAULT, { parent:this })});
        }
    },
    parse: function(response) {
        var self = this;
        // Instantiate StylesheetList and LayerList collections from JSON lists
        // of plain JSON objects.
        response.Stylesheet = new StylesheetList(response.Stylesheet ? response.Stylesheet : [], {parent:this});
        response.Layer = new LayerList(response.Layer ? response.Layer : [], {parent:this});
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
    layerURL: function(options) {
        var url = window.location.origin + this.url();
        if (options.signed) {
            var md5 = new MD5();
            url += '?' + md5.digest(JSON.stringify(this)).substr(0,6);
        }
        var mmlb64 = Base64.urlsafe_encode(url);
        return window.location.origin + '/tile/' + mmlb64 + '/${z}/${x}/${y}.png';
    },
    validate: function(attributes) {
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
        'click .file-delete': 'del'
    },
    del: function() {
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
        'click #header a.save': 'saveProject',
        'click #header a.info': 'projectInfo',
        'click #header a.minimal': 'minimal',
        'click #header a.home': 'home'
    },
    initialize: function () {
        _.bindAll(this, 'render', 'saveProject', 'projectInfo', 'home', 'minimal', 'changed');
        this.model.view = this;
        this.model.bind('change', this.changed);
        this.model.fetch({ success: this.render, error: this.render});
    },
    render: function() {
        $(this.el).html(ich.ProjectView(this.model));

        var layers = new LayerListView({collection: this.model.get('Layer')});
        var colors = new ColorSwatchesToolView({ parent:this }); // @TODO pass the model over.
        var stylesheets = new StylesheetListView({collection: this.model.get('Stylesheet')});
        var map = new MapView({model: this.model});
        var colorPicker = new ColorPickerToolView({model: this.model});
        var fontPicker = new FontPickerToolView({model: new Abilities, stylesheetsView: stylesheets});

        $('#sidebar', this.el).append(layers.el);
        $('#sidebar', this.el).append(colors.el);
        $('#sidebar', this.el).append(map.el);
        $('#toolbar', this.el).append(colorPicker.el);
        $('#toolbar', this.el).append(fontPicker.el);
        $('#main', this.el).append(stylesheets.el);

        window.app.el.html(this.el);
        window.app.trigger('ready');
        return this;
    },
    saveProject: function() {
        var self = this;
        this.model.save(this.model, {
            success: function() {
                self.model.trigger('save');
                $('#header a.save', self.el).removeClass('changed');
            },
            error: function(err) {
                window.app.message('Error', err);
            }
        });
        return false;
    },
    projectInfo: function() {
        window.app.message('Project Info', {
            'tilelive_url': this.model.layerURL({signed: true}),
            'mml_url': window.location.origin + this.model.url()
        }, 'projectInfo');
        return false;
    },
    home: function() {
        return (!$('#header a.save', this.el).is('.changed') || confirm('You have unsaved changes. Are you sure you want to close this project?'));
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
    },
    changed: function() {
        $('#header a.save', this.el).addClass('changed');
    }
});

/**
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

TileMill.project.watch = function() {
  $('#tabs a.tab').each(function() {
    TileMill.stylesheet.setCode($('#tabs a.active'), true);
    TileMill.stylesheet.mtime(
      $.url.setUrl($(this).data('tilemill').src).param('filename'),
      TileMill.project.checkStale);
  });
};
**/
