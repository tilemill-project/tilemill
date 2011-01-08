var Project = Backbone.Model.extend({
    SRS_DEFAULT: '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs',
    STYLESHEET_DEFAULT: [{
        id: 'style.mss',
        data: '#world {\n  polygon-fill: #eee;\n  line-color: #ccc;\n  line-width: 0.5;\n}'
    }],
    LAYER_DEFAULT: [{
        id: 'world',
        srs: '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs',
        Datasource: {
            file: 'http://tilemill-data.s3.amazonaws.com/world_borders_merc.zip',
            type: 'shape',
            estimate_extent: 'true',
            id: 'world'
        }
    }],
    initialize: function(attributes) {
        if (!this.get('srs')) {
            this.set({'srs': this.SRS_DEFAULT});
        }
        if (!this.get('Stylesheet')) {
            this.set({
                'Stylesheet': new StylesheetList(this.STYLESHEET_DEFAULT, {
                    parent: this
                })
            });
        }
        if (!this.get('Layer')) {
            this.set({
                'Layer': new LayerList(this.LAYER_DEFAULT, {
                    parent: this
                })
            });
        }
    },
    parse: function(response) {
        var self = this;
        // Instantiate StylesheetList and LayerList collections from JSON lists
        // of plain JSON objects.
        response.Stylesheet = new StylesheetList(response.Stylesheet ?
                response.Stylesheet :
                [], { parent: this });
        response.Layer = new LayerList(response.Layer ?
                response.Layer : [], { parent: this });
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
        // `window.location.origin` is not available in all browsers like
        // Firefox. @TODO This approach won't allow TileMill to be installed in
        // a subdirectory. Fix.
        var url = [window.location.protocol, window.location.host].join('//') + this.url();
        if (options.signed) {
            var md5 = new MD5();
            url += '?' + md5.digest(JSON.stringify(this)).substr(0, 6);
        }
        var mmlb64 = Base64.urlsafe_encode(url);
        return [window.location.protocol, window.location.host].join('//') + '/tile/' + mmlb64 + '/${z}/${x}/${y}.png';
    },
    validate: function(attributes) {
        if (/^[a-z0-9\-_]+$/i.test(attributes.id) === false) {
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
    initialize: function() {
        _.bindAll(this, 'render', 'add', 'about');
        this.collection.bind('add', this.render);
        this.collection.bind('remove', this.render);
        this.collection.fetch({
            success: this.render,
            error: this.render
        });
    },
    render: function() {
        // Render the projects wrapper if not present.
        if ($(this.el).has('ul.projects').length === 0) {
            $(this.el).html(ich.ProjectListView());
            window.app.el.html(this.el);
        }

        // Add a row view for each project.
        var that = this;
        this.collection.each(function(project) {
            if (!project.view) {
                project.view = new ProjectRowView({
                    model: project,
                    collection: this.collection
                });
                $('ul.projects', self.el).append(project.view.el);
            }
        });
        return this;
    },
    events: {
        'click input.submit': 'add',
        'click div#header a.info': 'about'
    },
    add: function() {
        window.app.loading();
        var that = this;
        var project = new Project;
        var success = project.set(
            { id: $('input.text', this.el).val() },
            { error: this.showError }
        );
        if (success) {
            project.save(project, {
                success: function() {
                    that.collection.add(project);
                    window.app.done();
                },
                error: this.showError
            });
        }
        return false;
    },
    about: function() {
        window.app.message('About TileLive', '@TODO: Put something facinating here.');
        return false;
    },
    showError: function(model, error) {
        window.app.done();
        window.app.message('Error', error);
    }
});

var ProjectRowView = Backbone.View.extend({
    tagName: 'li',
    className: 'clearfix',
    initialize: function() {
        _.bindAll(this, 'render', 'del');
        this.render();
    },
    render: function() {
        $(this.el).html(ich.ProjectRowView(this.model));
        return this;
    },
    events: {
        'click .delete': 'del'
    },
    del: function() {
        var that = this;
        window.app.loading();
        if (confirm('Are you sure you want to delete this project?')) {
            this.model.destroy({
                success: function() {
                    that.remove();
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
    id: 'ProjectView',
    events: {
        'click #header a.save': 'saveProject',
        'click #header a.info': 'projectInfo',
        'click #header a.minimal': 'minimal',
        'click #header a.home': 'home'
    },
    initialize: function() {
        _.bindAll(this, 'render', 'saveProject', 'projectInfo',
            'home', 'minimal', 'changed');
        this.model.view = this;
        this.model.bind('change', this.changed);
        this.model.fetch({
            success: this.render,
            error: this.render
        });
    },
    render: function() {
        $(this.el).html(ich.ProjectView(this.model));

        var layers = new LayerListView({
            collection: this.model.get('Layer')
        }),
            stylesheets = new StylesheetListView({
            collection: this.model.get('Stylesheet'),
            project: this.model
        }),
            colors = new ColorSwatchesToolView({
            collection: new ColorSwatchesList(null, {
                project: this.model
            }),
            project: this.model
        }),
            map = new MapView({
            model: this.model
        }),
            colorPicker = new ColorPickerToolView({
            model: this.model
        }),
            fontPicker = new FontPickerToolView({
            model: new Abilities,
            project: this.model
        });

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
        var that = this;
        this.model.save(this.model, {
            success: function() {
                that.model.trigger('save');
                $('#header a.save', self.el).removeClass('changed');
                $('.CodeMirror-line-numbers div')
                        .removeClass('syntax-error')
                        .attr('title', '');

            },
            error: function(err, data) {
                if (data.status == 500) {
                    var err_obj = $.parseJSON(data.responseText);
                    var editor = _.detect(
                        that.model.view.stylesheets.collection.models,
                        function(s) {
                            return s.id == err_obj.filename;
                    });
                    $('div:nth-child(' + err_obj.line + ')',
                        editor.view.codemirror.lineNumbers)
                        .addClass('syntax-error')
                        .attr('title', err_obj.message);
                }
            }
        });
        return false;
    },
    projectInfo: function() {
        window.app.message('Project Info', {
            'tilelive_url': this.model.layerURL({signed: true}),
            'mml_url': [window.location.protocol, window.location.host].join('//') + this.model.url()
        }, 'projectInfo');
        return false;
    },
    home: function() {
        return (!$('#header a.save', this.el).is('.changed') || confirm('You have unsaved changes. Are you sure you want to close this project?'));
    },
    minimal: function() {
        $('a.minimal', this.el).toggleClass('active');
        if ($('a.minimal', this.el).is('.active')) {
            $(this.el).addClass('minimal');
            this.watcher = new Watcher(this.model);
        }
        else {
            $(this.el).removeClass('minimal');
            this.watcher.destroy();
        }
        return false;
    },
    changed: function() {
        $('#header a.save', this.el).addClass('changed');
    }
});

/**
 * Watcher.
 * Class for updating project in minimal mode.
 */
var Watcher = function(model) {
    _.bindAll(this, 'fetch', 'destroy');
    var model = model;
    this.model = model;
    this.model.bind('change', this.fetch);
    this.md5 = new MD5();
    this.current = this.md5.digest(JSON.stringify(this.model));
    this.watcher = setInterval(function() { model.fetch(); }, 1000);
};

Watcher.prototype.fetch = function() {
    var state = this.md5.digest(JSON.stringify(this.model));
    if (this.current !== state) {
        this.current = state;
        this.model.trigger('save');
    }
};

Watcher.prototype.destroy = function() {
    window.clearInterval(this.watcher);
};

