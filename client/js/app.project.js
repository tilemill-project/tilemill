var ProjectListView = Backbone.View.extend({
    id: 'ProjectListView',
    initialize: function() {
        _.bindAll(this, 'render', 'add');
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

        // Add a row view for each project. Note that we use a pointer as the
        // projects are added to ensure that when new projects are added on a
        // re-render they are placed at the correct index in the list.
        var that = this;
        var pointer = null;
        this.collection.each(function(project) {
            if (!project.view) {
                project.view = new ProjectRowView({
                    model: project,
                    collection: this.collection
                });
                if (!pointer) {
                    $('ul.projects', self.el).prepend(project.view.el);
                }
                else {
                    $(pointer).after(project.view.el);
                }
            }
            pointer = project.view.el;
        });
        return this;
    },
    events: {
        'click input.submit': 'add',
        'click div#header a.info': 'about',
        'click div#header a.settings': 'settings'
    },
    add: function() {
        var id = $('input.text', this.el).val();
        if (this.collection.get(id)) {
            window.app.message('Error', 'Project names must be unique.');
            $('input.text', this.el).val('');
            return false;
        }
        window.app.loading();
        var that = this;
        var project = new Project;
        var success = project.set(
            { id: id },
            { error: this.showError }
        );
        if (success) {
            project.setDefaults();
            project.save(project, {
                success: function() {
                    $('input.text', this.el).val('');
                    that.collection.add(project);
                    window.app.done();
                },
                error: this.showError
            });
        }
        return false;
    },
    showError: function(model, error) {
        window.app.done();
        window.app.message('Error', error);
    },
    settings: function() {
        new SettingsPopupView({ model: window.app.settings });
        return false;
    }
});

var ProjectRowView = Backbone.View.extend({
    tagName: 'li',
    className: 'clearfix',
    initialize: function() {
        _.bindAll(this, 'render', 'del');
        this.render();
    },
    // See http://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#lon.2Flat_to_tile_numbers_2
    thumb: function() {
        var center = this.model.get('center') || {lat: 0, lon: 0, zoom: 2};
        var z = center.zoom;
        var lat_rad = center.lat * Math.PI / 180;
        var x = parseInt((center.lon + 180.0) / 360.0 * Math.pow(2,z));
        var y = parseInt((1.0 - Math.log(Math.tan(lat_rad) + (1 / Math.cos(lat_rad))) / Math.PI) / 2.0 * Math.pow(2,z));
        var url = this.model.layerURL({ signed: true });
        return url.replace('${z}', z).replace('${x}', x).replace('${y}', y);
    },
    render: function() {
        $(this.el).html(ich.ProjectRowView({
            id: this.model.get('id'),
            thumb: this.thumb()
        }));
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
        'click #header a.settings': 'settings',
        'click #header a.close': 'close',
        'click #header a.reference': 'reference'
    },
    initialize: function() {
        _.bindAll(this, 'render', 'saveProject',
            'home', 'minimal', 'changed', 'reference', 'setMinimal');
        window.app.settings.bind('change', this.setMinimal);
        this.model.view = this;
        this.model.bind('change', this.changed);
        this.model.fetch({
            success: this.render,
            error: function(err, data) {
                var obj = $.parseJSON(data.responseText);
                window.app.message('Error', obj.message, 'error', function() {
                    window.location = '/';
                });
            }
        });
    },
    render: function() {
        $(this.el).html(ich.ProjectView(this.model));

        var layers = new LayerListView({
            collection: this.model.get('Layer'),
            project: this.model
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
            model: this.model,
            project: this.model
        }),
            fontPicker = new FontPickerToolView({
            model: new Abilities,
            project: this.model
        });

        var jobQueue = new ExportJobList();
        var jobExportMenu = new ExportJobDropdownView({
            model: jobQueue,
            project: this.model,
            map: map
        });

        $('#header .actions', this.el).prepend(jobExportMenu.el);
        $('#sidebar', this.el).append(layers.el);
        $('#sidebar', this.el).append(colors.el);
        $('#sidebar', this.el).append(map.el);
        $('.sidebar-header', colors.el).append(colorPicker.el);
        $('#toolbar', this.el).append(fontPicker.el);
        $('#main', this.el).append(stylesheets.el);

        window.app.el.html(this.el);
        window.app.trigger('ready');
        this.setMinimal(); // set minimal/normal mode
        return this;
    },
    saveProject: function() {
        var that = this;

        // Clear out validation error markers. They will be re-drawn if this
        // save event encounters further errors.
        $('.CodeMirror-line-numbers div')
            .removeClass('syntax-error')
            .attr('title', '')
            .unbind('mouseenter mouseleave'); // Removes tipsy.
        $('a.tab.hasError', self.el).removeClass('hasError')
        $('.tipsy').remove();

        this.model.save(this.model, {
            success: function() {
                that.model.trigger('save');
                $('#header a.save', self.el).removeClass('changed');
            },
            error: function(err, data) {
                if (typeof data === 'string') {
                    window.app.message('Error', data);
                } else if (data.status == 500) {
                    var err_obj = $.parseJSON(data.responseText);
                    if (_.isArray(err_obj)) {
                        _.each(err_obj, function(error) {
                            if (error.line) {
                                var editor = _.detect(
                                    that.model.view.stylesheets.collection.models,
                                    function(s) {
                                        return s.id == error.filename;
                                });
                                $('div.CodeMirror-line-numbers div:nth-child('
                                    + error.line
                                    + ')',
                                    editor.view.codemirror.lineNumbers)
                                    .addClass('syntax-error')
                                    .attr('title', error.message)
                                    .tipsy({gravity: 'w'});
                                $(editor.view.el).addClass('hasError');
                            } else {
                                window.app.message('Error', error.message);
                            }
                        });
                    } else {
                        window.app.message('Error', err_obj.message);
                    }
                }
            }
        });
        return false;
    },
    close: function() {
        return (!$('#header a.save', this.el).is('.changed') || confirm('You have unsaved changes. Are you sure you want to close this project?'));
    },
    reference: function() {
        if (this.referenceView) {
            this.referenceView.remove();
            delete this.referenceView;
        }
        else {
            this.referenceView = new ReferenceView();
        }
        return false;
    },
    setMinimal: function() {
        var that = this;
        if (window.app.settings.get('mode') === 'minimal') {
            $(this.el).addClass('minimal');
            this.watcher = new Watcher(this.model, function() {
                that.model.trigger('save');
            });
        }
        else if (this.watcher) {
            $(this.el).removeClass('minimal');
            this.watcher.destroy();
        }
        return false;
    },
    changed: function() {
        $('#header a.save', this.el).addClass('changed');
    },
    settings: function() {
        new SettingsPopupView({ model: window.app.settings });
        return false;
    }
});

/**
 * Watcher.
 *
 * Class for polling a given model (or collection) and firing a callback
 * when it changes.
 */
var Watcher = function(model, callback) {
    _.bindAll(this, 'fetch', 'destroy');
    var model = model;
    this.model = model;
    this.model.bind('change', this.fetch);
    this.callback = callback;
    this.md5 = new MD5();
    this.current = this.md5.digest(JSON.stringify(this.model));
    this.watcher = setInterval(function() { model.fetch(); }, 1000);
};

Watcher.prototype.fetch = function() {
    var state = this.md5.digest(JSON.stringify(this.model));
    if (this.current !== state) {
        this.current = state;
        this.callback && this.callback();
    }
};

Watcher.prototype.destroy = function() {
    window.clearInterval(this.watcher);
};

