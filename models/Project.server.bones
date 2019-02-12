var fs = require('fs');
var Step = require('step');
var path = require('path');
var read = require('../lib/fsutil.js').read;
var readdir = require('../lib/fsutil.js').readdir;
var mkdirp = require('../lib/fsutil.js').mkdirp;
var rm = require('../lib/fsutil.js').rm;
var carto = require('carto');
var mapnik = require('mapnik');
var yaml = require('js-yaml');
if (mapnik.register_default_fonts) mapnik.register_default_fonts();
if (mapnik.register_system_fonts) mapnik.register_system_fonts();
if (mapnik.register_default_input_plugins) mapnik.register_default_input_plugins();

var EventEmitter = require('events').EventEmitter;
var millstone = require('millstone');
var settings = Bones.plugin.config;
var tileURL = _('http://<%=url%>/tile/<%=id%>/{z}/{x}/{y}.<%=format%>?updated=<%=updated%>&metatile=<%=metatile%>&scale=<%=scale%>').template();
var request = require('request');
var existsSync = require('fs').existsSync || require('path').existsSync;

// object tracks status of tileserver's status localizing a project
// key:model.id value:friendly message about activity or ''
var project_tile_status = {};

// Project
// -------
// Implement custom sync method for Project model. Writes projects to
// individual directories and splits out Stylesheets from the main project
// MML JSON file.
models.Project.prototype.sync = function(method, model, success, error) {
    switch (method) {
    case 'read':
        if (model.id) {
            loadProject(model, function(err, model) {
                return err ? error(err) : success(model);
            });
        } else {
            loadProjectAll(model, function(err, model) {
                return err ? error(err) : success(model);
            });
        }
        break;
    case 'create':
    case 'update':
        // disabled until https://github.com/tilemill-project/tilemill/issues/1851 is resolved
        /*mapnik.clearCache();
        request.get({ url:'http://'+settings.tileUrl+'/clear-mapnik-cache' }, function(err) {
            if (err) return error(err);
            delete project_tile_status[model.id];
            saveProject(model, function(err, model) {
                return err ? error(err) : success(model);
            });
        });
        */
        delete project_tile_status[model.id];
        saveProject(model, function(err, model) {
            return err ? error(err) : success(model);
        });
        break;
    case 'delete':
        mapnik.clearCache();
        delete project_tile_status[model.id];
        destroyProject(model, function(err) {
            return err ? error(err) : success({});
        });
        break;
    // Custom sync method for Project model. A sync request is made with the
    // `_updated` attr of the model set. The mtime of the model is first
    // checked -- if it is later than the provided time a full read is done,
    // otherwise no attributes are returned to be updated.
    case 'mtime':
        mtimeProject(model, function(err, mtime) {
            if (mtime > model.get('_updated')) {
                loadProject(model, function(err, model) {
                    return err ? error(err) : success(model);
                });
            } else {
                success({});
            }
        });
        break;
    // simple status poll, designed to get tileserver instance status
    case 'status':
        success({status:project_tile_status[model.id]});
        break;
    // Custom sync method to flush the cache for a specific model. Requires
    // `model.options.layer` to be set.
    case 'flush':
        flushProject(model, function(err) {
            return err ? error(err) : success({});
        });
        break;
    }
};

// Custom validation method that allows for asynchronous processing.
// Expects options.success and options.error callbacks to be consistent
// with other Backbone methods. Now reduced to catching only Carto
// compilation errors.
models.Project.prototype.validateAsync = function(attributes, options) {
    compileStylesheet(_(attributes).clone(), function(err) {
        if (err) return options.error(this, err);
        return options.success(this, null);
    });
};

// Wrap save to call validateAsync first.
models.Project.prototype.save = _(Backbone.Model.prototype.save)
.wrap(function(parent, attrs, options) {
    var err = this.validate(attrs);
    if (err) return options.error(this, err);

    this.validateAsync(attrs, {
        success: _(function() {
            parent.call(this, attrs, options);
        }).bind(this),
        error: options.error
    });
});

// Flush the cache for a project's layer.
function flushProject(model, callback) {
    if (!model.options || !model.options.layer)
        return callback(new Error('options.layer required.'));
    if (!model.options || !model.options.url)
        return callback(new Error('options.url required.'));

    var options = {
        url: model.options.url,
        layer: model.options.layer,
        base: path.join(settings.files, 'project', model.id),
        cache: path.join(settings.files, 'cache')
    };
    millstone.flush(options, callback);
}

// Get the mtime for a project.
function mtimeProject(model, callback) {
    var modelPath = path.resolve(path.join(settings.files, 'project', model.id));
    readdir(modelPath, function(err, files) {
        if (err) return callback(err);
        var max = _(files).chain()
            .filter(function(stat) {
                return stat.basename.charAt(0) !== '.' && stat.isFile(); //ignore hidden files
            })
            .pluck('mtime')
            .map(Date.parse)
            .max()
            .value();
        callback(null, max);
    });
}

// Migrate a TileJSON 1.0.0 project to 2.0.0
function migrate100_200(object) {
    function formatterToTemplate(formatter) {
        return formatter.replace(/\[([\w\d]+)\]/g, '{{{$1}}}');
    }
    if (object.interactivity) {
        _([
          'template_teaser',
          'template_full',
          'template_location']).each(function(t) {
            if (object.interactivity[t]) {
                object.interactivity[t] = formatterToTemplate(object.interactivity[t]);
            }
        });
    }
    return object;
}

// Load a single project model.
function loadProject(model, callback) {
    var modelPath = path.resolve(path.join(settings.files, 'project', model.id));
    var object = {};
    Step(function() {
        mtimeProject(model, this);
    },
    function(err, mtime) {
        object._updated = mtime;
        var cb = this;
        read(path.join(modelPath, 'project.mml'), function(err, stat) {
            if (! err) return cb(err, stat);

            // If `project.mml` is missing, fall back to `project.yml`, `PROJECTNAME.mml`, `PROJECTNAME.yml`
            read(path.join(modelPath, 'project.yml'), function(err, stat) {
                if (! err) return cb(err, stat);
                read(path.join(modelPath, model.id + '.mml'), function(err, stat) {
                    if (! err) return cb(err, stat);
                    read(path.join(modelPath, model.id + '.yml'), cb);
                });
            });
        });
    },
    function(err, file) {
        // projectName is only used for error messages
        var projectName = path.join(modelPath, 'project.mml');
        if (err) return callback(new Error.HTTP('Project does not exist: "' + projectName + '"', 404));
        try {
            object = _(object).extend(yaml.safeLoad(file.data));
        } catch(err) {
            var err_message = 'Could not open project.mml file for "' + model.id + '". Error was: \n\n"' + err.message + '"\n\n(in ' + projectName + ')';
            return callback(new Error(err_message));
        }

        object.id = model.id;
        if (object.Stylesheet && object.Stylesheet.length > 0) {
            var group = this.group();
            object.Stylesheet.forEach(function(filename) {
                read(path.join(modelPath, filename), group());
            });
        } else {
            this(null, []);
        }
    },
    function(err, stylesheets) {
        if (err && err.code === 'ENOENT') {
            stylesheets = _(stylesheets).compact();
        } else if (err) {
            return this(err);
        }

        // Embed stylesheet contents at the `Stylesheet` key.
        object.Stylesheet = _(stylesheets).map(function(file) {
            return {
                id: file.basename,
                data: file.data
            };
        });

        // Migrate old properties to tilejson equivalents.
        ['_center', '_format', '_interactivity', '_legend'].forEach(function(k) {
            if (!object[k]) return;
            object[k.substr(1)] = object[k.substr(1)] || object[k];
            delete object[k];
        });
        if (object.center && !_(object.center).isArray()) {
            object.center = [
                object.center.lon || 0,
                object.center.lat || 0,
                object.center.zoom || 0
            ];
        }

        // TileJSON version migration
        switch (object.tilejson) {
            // Current version should be at the top
            case '2.0.0':
                break;
            // version-less object is 1.0.0
            default:
                object = migrate100_200(object);
                break;
        }

        // Generate dynamic properties.
        object.tilejson = '2.0.0';
        object.scheme = 'xyz';
        object.tiles = [tileURL({
            url: settings.tileUrl,
            id: model.id,
            format: 'png',
            updated: object._updated,
            metatile: object.metatile,
            scale: object.scale
        })];
        object.grids = [tileURL({
            url: settings.tileUrl,
            id: model.id,
            format: 'grid.json',
            updated: object._updated,
            metatile: object.metatile,
            scale: object.scale
        })];
        object.template = template(object.interactivity);
        if (object.interactivity) {
            object.interactivity.fields = fields(object);
        }
        this();
    },
    function(err) {
        return callback(err, object);
    });
}

// Load all projects into an array.
function loadProjectAll(model, callback) {
    var basepath = path.resolve(path.join(settings.files, 'project'));
    Step(function() {
        mkdirp(basepath, 0777, this);
    },
    function(err) {
        if (err) return callback(new Error("TileMill cannot write to projects root: '" + basepath + "'' (" + err.message + ")"));
        readdir(basepath, this);
    },
    function(err, files) {
        if (err) return callback(err);
        if (files.length === 0) return this(null, []);
        var group = this.group();
        _(files).chain()
            .filter(function(file) {
                var modelPath = path.join(basepath, file.basename);
                return ((file.isDirectory() && file.basename[0] !== '.')
                         && (existsSync(path.join(modelPath, 'project.mml')) ||
                             existsSync(path.join(modelPath, 'project.yml')) ||
                             existsSync(path.join(modelPath, file.basename + '.mml')) ||
                             existsSync(path.join(modelPath, file.basename + '.yml'))));
            })
            .each(function(file) { loadProject({id:file.basename}, group()) });
    },
    function(err, models) {
        if (err && process.env.NODE_ENV === 'development') console.log('[tilemill] skipped loading project: ' + err.toString());
        // Ignore errors from loading individual models (e.g.
        // don't let one bad apple spoil the collection).
        models = _(models).chain()
            .select(function(model) { return model && model.id })
            .sortBy(function(model) { return model.id })
            .value();
        return callback(null, models);
    });
}

// Destroy a project. `rm -rf` equivalent for the project directory.
function destroyProject(model, callback) {
    var modelPath = path.resolve(path.join(settings.files, 'project', model.id));
	if (process.platform === 'win32') {
        // https://github.com/tilemill-project/tilemill/issues/1121
        // Workaround to access denied error on Windows when mapnik has
        // open file handles to a data file in a project that needs to
        // be deleted. Stopgap is to kill the tileserver, delete the project
        // and let the tileserver start back up on its own.
        // NOTE: not needed with symlinks but millstone does not always use symlinks
        // so we need this on win32 as per https://github.com/mapbox/millstone/issues/71
        request.post({ url:'http://'+settings.tileUrl+'/restart' }, function(err) {
            rm(modelPath, callback);
        });
    } else {
        rm(modelPath, callback);
    }
}

// Save a project. Creates a subdirectory per project and splits out
// stylesheets into separate files.
function saveProject(model, callback) {
    var modelPath = path.resolve(path.join(settings.files, 'project', model.id));
    Step(function() {
        mkdirp(modelPath, 0777, this);
    },
    function(err) {
        if (err) throw err;
        // Hard clone the model JSON before doing adjustments to the data
        // based on writing separate stylesheets.
        var data = JSON.parse(JSON.stringify(model.toJSON()));
        var files = {};
        var schema = model.schema.properties;
        files['project.mml'] = {};

        data.Stylesheet = _(data.Stylesheet).map(function(s) {
            if (s.id) files[s.id] = s.data;
            return s.id || s;
        });

        data.Layer = _(data.Layer).map(function(l) {
            if (l.Datasource.file) {
                l.Datasource.file = l.Datasource.file.trim();
                if (!l.Datasource.file.indexOf(modelPath)) {
                    l.Datasource.file = path.relative(modelPath, l.Datasource.file);
                } else {
                    l.Datasource.file = l.Datasource.file.replace(/^~/, process.env.HOME);
                }

                //Try to guess type of datasource and set it to project file for better compatibility with kosmtik
                if (!l.Datasource.type) {
                    var ext = path.extname(l.Datasource.file);
                    if (ext) {
                        var type = millstone.valid_ds_extensions[ext];
                        if (type) {
                            l.Datasource.type = type;
                        }
                    }
                }
            }
            return l;
        });

        _(data).chain()
            .keys()
            .filter(function(k) { return schema[k] && !schema[k].ignore })
            .each(function(k) { files['project.mml'][k] = data[k]; });

        var group = this.group();
        _(files).each(function(data, filename) {
            fs.writeFile(
                path.join(modelPath, filename),
                _(data).isString() ? data : JSON.stringify(data, null, 2),
                group()
            );
        });
    },
    function(err) {
        if (err) throw err;
        mtimeProject(model, this);
    },
    function(err, updated) {
        if (err) throw err;
        var tiles = tileURL({
            url: settings.tileUrl,
            id: model.id,
            format: 'png',
            updated: updated,
            metatile: model.get('metatile'),
            scale: model.get('scale')
        });
        var grids = tileURL({
            url: settings.tileUrl,
            id: model.id,
            format: 'grid.json',
            updated: updated,
            metatile: model.get('metatile'),
            scale: model.get('scale')
        });
        callback(err, {
            _updated: updated,
            tiles: [tiles],
            grids: [grids],
            template: template(model.get('interactivity'))
        });

        if (err) throw err;
        // Request and cache a thumbnail tile from the tile server.
        // Single tile thumbnail URL generation. From [OSM wiki][1].
        // [1]: http://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#lon.2Flat_to_tile_numbers_2
        var z = model.get('center')[2];
        var lat_rad = model.get('center')[1] * Math.PI / 180;
        var x = parseInt((model.get('center')[0] + 180.0) / 360.0 * Math.pow(2, z));
        var y = parseInt((1.0 - Math.log(Math.tan(lat_rad) + (1 / Math.cos(lat_rad))) / Math.PI) / 2.0 * Math.pow(2, z));
        request.get({
            url: tiles.replace('{z}',z).replace('{x}',x).replace('{y}',y),
            encoding: 'binary'
        }, this);
    }, function(err, res, body) {
        if (err) throw err;
        fs.writeFile(path.join(modelPath, '.thumb.png'), body, 'binary', this);
    }, function(err) {
        if (err && err.code !== 'ENOENT') console.error(err);
    });
}

function compileStylesheet(mml, callback) {
    // Parse project stylesheets for `font-directory` property and register
    // font path if it is present so that `validation_data` includes fonts from
    // this directory.
    // @TODO Probably the only more reasonable way to do this would be to have
    // carto expand validation data dynamically to include this dir when it
    // comes across this map property. Gross....
    var styles = _(mml.Stylesheet || []).pluck('data').join('\n');
    var fonts = styles.match(/font-directory:[\s]*url\(['"]*([^'"\)]*)['"]*\)/);
    if (fonts) {
        fonts = fonts[1];
        // @TODO - will be broken on windows
        fonts = fonts.charAt(0) !== '/'
            ? path.join(settings.files, 'project', mml.id, fonts)
            : fonts;
        mapnik.register_fonts(fonts);
    }

    var env = {
        validation_data: { fonts: mapnik.fonts() },
        returnErrors: true,
        effects: []
    };

    // try/catch here as per https://github.com/tilemill-project/tilemill/issues/1370
    // with carto 1.x, it no longer throws an error for compile errors, instead returned data is null
    try {
        var xml = new carto.Renderer(env, { mapnik_version: mapnik.versions.mapnik }).render(mml);
        if (xml.data != null) {
            return callback(null, xml);
        } else {
            return callback(new Error(xml.msg[0].filename + ":" +
            xml.msg[0].line + ":" +
            xml.msg[0].column + " " +
            xml.msg[0].message));
        }
    } catch (err) {
        return callback(err);
    }
}

var localizedCache = {};

// Localizes an MML file and compiles the stylesheet for use in tilelive-mapnik.
models.Project.prototype.localize = function(mml, callback) {
    var model = this;
    var key = path.join(settings.files, 'project', model.id);

    function done() {
        model.xml = localizedCache[key].xml;
        model.mml = localizedCache[key].mml;
        model.debug = localizedCache[key].debug;
        callback(null);
    }

    if (localizedCache[key]) {
        if (mml._updated === 0) {
            // Caller may set _updated to 0 to force a cache clear.
            delete localizedCache[key];
        } else if (localizedCache[key].updated < mml._updated) {
            // The existing item is outdated.
            delete localizedCache[key];
        } else if (localizedCache[key].mml && localizedCache[key].xml) {
            // This is already loaded.
            return done();
        } else {
            return localizedCache[key].once('load', done);
        }
    }

    // Actually load the object.
    localizedCache[key] = new EventEmitter;
    localizedCache[key].debug = {};
    localizedCache[key].updated = mml._updated;
    localizedCache[key].setMaxListeners(0);
    localizedCache[key].once('load', done);

    var localizeTime;
    var compileTime;
    var resolveInterval = {};
    Step(function() {
        localizeTime = (+new Date);
        project_tile_status[model.id] = 'patience, loading project';
        resolveInterval = setInterval(function() {
            if (millstone.downloads) {
                var num_downloads = Object.keys(millstone.downloads).length;
                if (num_downloads) {
                    project_tile_status[model.id] = 'caching ' + num_downloads + ' resource' + (num_downloads > 1 ? 's' : '');
                }
            }
        },1000);
        millstone.resolve({
            mml: mml,
            base: path.join(settings.files, 'project', model.id),
            cache: path.join(settings.files, 'cache')
        }, this);
    }, function(err, localized) {
        clearInterval(resolveInterval);
        if (err) {
            delete project_tile_status[model.id];
            throw err;
        }

        localizedCache[key].debug.localize = (+new Date) - localizeTime + 'ms';
        localizedCache[key].mml = localized;

        compileTime = (+new Date);
        project_tile_status[model.id] = 'compiling css';
        compileStylesheet(localized, this);
    }, function(err, compiled) {
        // clear the status, indicating project is finished loading
        if (project_tile_status[model.id]) delete project_tile_status[model.id];
        if (err) {
            throw err;
        }
        localizedCache[key].debug.compile = (+new Date) - compileTime + 'ms';
        localizedCache[key].xml = compiled.data;
        localizedCache[key].emit('load');
    }, function(err) {
        if (!err) return;
        delete localizedCache[key];
        callback(err);
    });
};

// Generate list of fields from model attributes.
function fields(opts) {
    opts = opts || {};
    opts.interactivity = opts.interactivity || {};
    var full = opts.interactivity.template_full || '';
    var teaser = opts.interactivity.template_teaser || '';
    var location = opts.interactivity.template_location || '';

    // Determine fields that need to be included from templates.
    // @TODO allow non-templated fields to be included.
    var fields = [full, teaser, location]
        .join(' ').match(/\{\{#?\/?\^?([\w\d\s-:]+)\}\}/g) || [];

    // Include `key_field` for PostGIS Layers.
    var layer = opts.interactivity.layer;
    _(opts.Layer).each(function(l) {
        if (l.id !== opts.interactivity.layer) return;
        if (l.Datasource && l.Datasource.key_field)
            fields.push('{{{' + l.Datasource.key_field + '}}}');
    });

    return _(fields).chain()
        .filter(_.isString)
        .map(function(field) {
            return field.replace(/[\^#\/\{\{|\}\}]/g, '');
        })
        .uniq()
        .value();
}

// Generate combined template from templates.
function template(opts) {
    if (!opts || !opts.layer || (!opts.template_teaser && !opts.template_full && !opts.template_location))
        return "";

    return '{{#__location__}}' + (opts.template_location || '') + '{{/__location__}}' +
        '{{#__teaser__}}' + (opts.template_teaser || '') + '{{/__teaser__}}' +
        '{{#__full__}}' + (opts.template_full || '') + '{{/__full__}}';
}
