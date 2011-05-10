// ExportListView
// --------------
// List of all exports. Available as a pane from LibraryListView.
var ExportListView = Backbone.View.extend({
    initialize: function() {
        _.bindAll(this, 'render');
        this.render();
    },
    render: function() {
        !this.$('.exports').size() && $(this.el).html(ich.ExportListView({}, true));
        var that = this;
        that.collection.each(function(xport) {
            if (!xport.view) {
                xport.view = new ExportRowView({ model: xport });
                that.$('.exports').append(xport.view.el);
            }
        });
    }
});

// ExportDrawerView
// ----------------
// Shows a list of current exports from an ExportList collection in a sidebar
// drawer.
var ExportDrawerView = DrawerView.extend({
    initialize: function() {
        this.options.title = 'Exports';
        this.options.content = ich.ExportDrawerView({}, true);
        this.bind('render', this.renderExports);
        window.app.controller.saveLocation('project/' + this.options.project.id + '/export');
        DrawerView.prototype.initialize.call(this);
    },
    renderExports: function() {
        var that = this;
        this.collection.fetch({
            success: function() {
                that.collection.each(function(xport) {
                    if (!xport.view) {
                        xport.view = new ExportRowView({ model: xport });
                        that.$('.exports').append(xport.view.el);
                    }
                });
            }
        });
    },
    remove: function() {
        window.app.controller.saveLocation('project/' + this.options.project.id);
        return DrawerView.prototype.remove.call(this);
    }
});

// View: ExportRowView
// -------------------
// A single job row in an ExportListView or ExportDrawerView. Uses `Watcher` to
// update the progress display of each job and provides download/delete actions
// for each export.
var ExportRowView = Backbone.View.extend({
    tagName: 'li',
    className: 'clearfix',
    events: {
        'click a.delete': 'destroy'
    },
    initialize: function() {
        _.bindAll(this, 'render', 'destroy', 'update');
        this.render();

        // If this model has not been processed, add a watcher to update its status.
        if (this.model.get('status') !== 'complete' && this.model.get('status') !== 'error') {
            this.watcher = new Watcher(this.model, this.update, 5000);
        }
    },
    update: function() {
        // Remove watcher when complete.
        if (this.model.get('status') === 'complete' || this.model.get('status') === 'error') {
            this.watcher.destroy();
        }
        this.render();
    },
    render: function() {
        $(this.el).html(ich.ExportRowView({
            time: this.model.time(),
            progress: parseInt(this.model.get('progress') * 100, 10),
            progressClass: parseInt(this.model.get('progress') * 10, 10),
            filename: this.model.get('filename'),
            status: this.model.get('status'),
            error: this.model.get('error'),
            format: this.model.get('format'),
            download: this.model.downloadURL()
        }));
    },
    destroy: function() {
        var that = this;
        if (confirm('Are you sure you want to delete this export?')) {
            this.model.destroy({
                success: function() {
                    that.remove();
                },
                error: function() {
                    window.app.message('Error', 'The job could not be deleted.');
                }
            });
        }
        return false;
    }
});

// ExportView
// ----------
// Abstract view for the project export form.
//
// - `options.model` Export model
// - `options.project` Project model
var ExportView = Backbone.View.extend({
    id: 'ExportView',
    events: _.extend({
        'click a.reset': 'boundingBoxReset',
        'click input.submit': 'submit',
        'change input': 'updateModel',
        'change select': 'updateModel'
    }, PopupView.prototype.events),
    initialize: function() {
        _.bindAll(this, 'boundingBoxAdded', 'boundingBoxReset', 'updateModel', 'updateUI');
        this.map = this.options.map.map;
        this.render();
        this.model.bind('change', this.updateUI);
        // TODO: bbox should be represented in model as a string.
        this.model.set({ bbox: this.map.getExtent() });
        window.app.controller.saveLocation('project/' + this.options.project.id + '/export/' + this.options.format);
    },
    render: function() {
        $(this.el).html(ich.ExportView(this.options));
        window.app.el.append(this.el);
        this.options.map.map.maximize();
        this.options.map.$('.wax-fullscreen').hide();
        this.options.map.$('.map-legend').hide();
        return this;
    },
    // ExportCropControl callback. Sets the bounding box of the
    // model when a user drags a crop box over the map.
    boundingBoxAdded: function(box) {
        this.model.set({
            bbox: box.geometry.components[1].getBounds().toArray().join(',')
        });
        return false;
    },
    // Resets the bounding box of the model to the maximum layer extents.
    boundingBoxReset: function() {
        this.model.set({
            bbox: [-180, -90, 180, 90].join(',')
        });
        return false;
    },
    // Update the export model from form fields.
    updateModel: function(event) {
        var data = {};
        var key = $(event.target).attr('id');
        if ($(event.target).is('.bbox')) {
            // TODO: bbox should be represented in model as a string.
            data.bbox = [
                {
                    lat: parseFloat(this.$('#bbox-n').val()),
                    lon: parseFloat(this.$('#bbox-w').val())
                },
                {
                    lat: parseFloat(this.$('#bbox-s').val()),
                    lon: parseFloat(this.$('#bbox-e').val())
                }
            ];
        } else if (key === 'width' || key === 'height') {
            data[$(event.target).attr('id')] = parseFloat($(event.target).val());
        } else {
            data[$(event.target).attr('id')] = $(event.target).val();
        }
        this.model.set(data);
    },
    // Update form field values when model values change.
    updateUI: function(model) {
        var that = this;
        _.each(model.changedAttributes(), function(value, key) {
            if (key === 'bbox') {
                // TODO: bbox should be represented in model as a string.
                that.$('#bbox-w').val(value[0].lon);
                that.$('#bbox-s').val(value[1].lat);
                that.$('#bbox-e').val(value[1].lon);
                that.$('#bbox-n').val(value[0].lat);
                // TODO: Update control
                // that.boxDrawingControl.drawFeature(bbox, true);
            } else {
                that.$('#' + key).val(value);
            }
        });
    },
    submit: function() {
        this.options.collection.add(this.model);
        this.model.save();
        this.close();
        new ExportDrawerView({
            collection: new ExportList(),
            project: this.options.project
        });
        return false;
    },
    close: function() {
        this.options.map.map.minimize();
        this.options.map.$('.wax-fullscreen').show();
        this.options.map.$('.map-legend').show();
        PopupView.prototype.close.call(this);
        window.app.controller.saveLocation('project/' + this.options.project.id);
        return false;
    }
});

// ExportImageView
// ---------------
// Abstract image export class. The following properites should be populated
// in `initialize` before calling the parent method when extending this class:
//
// - 'this.options.extension' file format extension for this export format.
// - 'this.options.title' user-friendly name for this export format.
var ExportImageView = ExportView.extend({
    initialize: function() {
        ExportView.prototype.initialize.call(this);
        var size = this.map.getSize();
        this.model.set({
            filename: this.options.project.get('id')
                + '.'
                + this.options.extension,
            width: size.w,
            height: size.h,
            aspect: size.w / size.h
        });
        this.model.bind('change:width', this.updateDimensions);
        this.model.bind('change:height', this.updateDimensions);
        this.model.bind('change:aspect', this.updateDimensions);
    },
    render: function() {
        ExportView.prototype.render.call(this);
        this.$('.palette').append(ich.ExportImageView(this.options));
        return this;
    },
    boundingBoxAdded: function(box) {
        var bounds = box.geometry.components[1].getBounds();
        this.model.set({aspect: bounds.getWidth() / bounds.getHeight()});
        ExportView.prototype.boundingBoxAdded.call(this, box);
    },
    // Update the image width or height based on the bounding box aspect ratio
    // when the user changes one of the w/h/bbox values.
    updateDimensions: function(model) {
        var attributes = model.changedAttributes();
        if (attributes.width) {
            model.set({
                height: Math.round(attributes.width / model.get('aspect'))},
                {silent: true}
            );
        } else if (attributes.height) {
            model.set({
                width: Math.round(model.get('aspect') * attributes.height)},
                {silent: true}
            );
        } else if (attributes.aspect) {
            model.set({
                height: Math.round(model.get('width') / attributes.aspect)},
                {silent: true}
            );
        }
    }
});

// PDF format
var ExportPDFView = ExportImageView.extend({
    initialize: function() {
        this.options.title = 'Export PDF';
        this.options.extension = 'pdf';
        ExportImageView.prototype.initialize.call(this);
    }
});

// PNG format
var ExportPNGView = ExportImageView.extend({
    initialize: function() {
        this.options.title = 'Export PNG';
        this.options.extension = 'png';
        ExportImageView.prototype.initialize.call(this);
    }
});

// ExportMBTilesView
// -----------------
// MBTiles export form. MBTiles exports include a range of zoom levels to
// render as well as key/value metadata pairs for describing the mbtiles data
// itself.
var ExportMBTilesView = ExportView.extend({
    initialize: function() {
        _.bindAll(this, 'changeZoomLevels', 'updateZoomLabels', 'formatterJS');
        this.options.title = 'Export MBTiles';
        this.options.extension = 'mbtiles';
        ExportView.prototype.initialize.call(this);

        // Set default values.
        this.model.set({
            filename: this.options.project.get('id')
                + '.'
                + this.options.extension,
            minzoom: 0,
            maxzoom: 8,
            tile_format: this.options.project.get('_format'),
            interactivity: this.options.project.get('_interactivity'),
            metadata_name: this.options.project.get('id'),
            metadata_description: '',
            metadata_version: '1.0.0',
            metadata_type: 'baselayer',
            metadata_formatter: this.options.project.formatterJS()
        });
    },
    render: function() {
        ExportView.prototype.render.call(this);
        this.$('.palette').append(ich.ExportMBTilesView({
            minzoom: this.model.get('minzoom'),
            maxzoom: this.model.get('maxzoom'),
            metadata_name: this.model.get('metadata_name'),
            metadata_description: this.model.get('metadata_description'),
            metadata_version: this.model.get('metadata_version'),
            metadata_type_baselayer: this.model.get('metadata_type') === 'baselayer'
        }));
        this.$('#mbtiles-zoom').slider({
            range: true,
            min:0,
            max:22,
            step:1,
            slide: this.updateModel
        });
    },
    updateModel: function(event, ui) {
        ExportView.prototype.updateModel.call(this, event);
        if ($(event.target).is('#mbtiles-zoom')) {
            this.model.set({
                minzoom: ui.values[0],
                maxzoom: ui.values[1]
            });
        }
    },
    updateUI: function(model) {
        ExportView.prototype.updateUI.call(this, model);
        this.$('#mbtiles-zoom').slider('values', 0, this.model.get('minzoom'));
        this.$('#mbtiles-zoom').slider('values', 1, this.model.get('maxzoom'));
        this.$('span.min-zoom').text(this.model.get('minzoom'));
        this.$('span.max-zoom').text(this.model.get('maxzoom'));
    }
});

// ExportDropdownView
// ------------------
// Dropdown menu for selecting the export format for a project.
var ExportDropdownView = DropdownView.extend({
    FORMAT: {
        png: ExportPNGView,
        pdf: ExportPDFView,
        mbtiles: ExportMBTilesView
    },
    initialize: function() {
        _.bindAll(this, 'xport', 'exportList');
        this.project = this.options.project;
        this.map = this.options.map;
        this.options.title = 'Export';
        this.options.content = ich.ExportOptions(
            window.app.abilities.get('exports'),
            true
        );
        this.render();
    },
    events: _.extend({
        'click a.export-option': 'xport',
        'click a.exports': 'exportList'
    }, DropdownView.prototype.events),
    xport: function(event) {
        var format = typeof event === 'string'
            ? event
            : $(event.currentTarget).attr('href').split('#').pop();
        if (!this.FORMAT[format]) {
            window.app.message('Error', 'Unsupported export format.', 'error');
        } else {
            // Close all drawers. This is quite a hack, but better than the
            // other options atm...
            $('.drawer a.close').click();
            new this.FORMAT[format]({
                model: new Export({
                    project: this.project.id,
                    format: format
                }),
                project: this.project,
                collection: this.collection,
                map: this.map,
                format: format
            });
        }
        this.hideContent();
        return false;
    },
    exportList: function(event) {
        new ExportDrawerView({
            project: this.project,
            collection: new ExportList()
        });
        this.hideContent();
        return false;
    }
});
