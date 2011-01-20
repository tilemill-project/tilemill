/**
 * View: ExportJobListView
 *
 * Shows a list of current export jobs from an ExportJobList collection in a
 * sidebar drawer.
 */
var ExportJobListView = DrawerView.extend({
    initialize: function() {
        this.options.title = 'Export jobs';
        this.options.content = ich.ExportJobListView({}, true);
        this.bind('render', this.renderJobs);
        DrawerView.prototype.initialize.call(this);
    },
    renderJobs: function() {
        var that = this;
        this.collection.fetch({
            success: function() {
                that.collection.each(function(job) {
                    if (!job.view) {
                        job.view = new ExportJobRowView({ model: job });
                        $('.jobs', that.el).append(job.view.el);
                    }
                });
            }
        });
    }
});

/**
 * View: ExportJobRowView
 *
 * A single job row in an ExportJobListView.
 */
var ExportJobRowView = Backbone.View.extend({
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
            this.watcher = new Watcher(this.model, this.update);
        }
    },
    update: function() {
        // Remove watcher when complete.
        if (this.model.get('status') !== 'complete' || this.model.get('status') !== 'error') {
            this.watcher.destroy();
        }
        this.render();
    },
    render: function() {
        $(this.el).html(ich.ExportJobRowView({
            filename: this.model.get('filename'),
            status: this.model.get('status')
        }));
    },
    destroy: function() {
        var that = this;
        if (confirm('Are you sure you want to delete this job?')) {
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

var ExportJobDropdownView = DropdownView.extend({
    initialize: function() {
        _.bindAll(this, 'export', 'jobs');
        this.options.title = 'Export';
        this.options.content = ich.ExportJobOptions({}, true);
        this.render();
    },
    events: _.extend(DropdownView.prototype.events, {
        'click a.export-option': 'export',
        'click a.jobs': 'jobs'
    }),
    export: function(event) {
        this.options.map.xport($(event.currentTarget).attr('href').split('#').pop(), this.model);
        this.toggleContent();
        return false;
    },
    jobs: function(event) {
        new ExportJobListView({ collection: new ExportJobList });
        this.toggleContent();
        return false;
    }
});

var ExportJobView = Backbone.View.extend({
    render: function() {
        $(this.el).html(ich.ExportJobView(this.options));
        $('.palette', this.el).append(this.getFields());
        window.app.el.append(this.el);
        return this;
    },
    initialize: function() {
        _.bindAll(this, 'boundingBoxAdded', 'updateUI');
        this.model.bind('change', this.updateUI);

        $('body').addClass('exporting');
        this.options.map.maximize();
        this.render();
        var boundingBox = this.options.map.map.getExtent().toArray();
        this.model.set({
            bbox: boundingBox.join(',')
        });

        this.boxDrawingLayer = new OpenLayers.Layer.Vector('Temporary Box Layer');
        this.boxDrawingControl = new OpenLayers.Control.DrawFeature(
            this.boxDrawingLayer,
            OpenLayers.Handler.RegularPolygon,
            {
                featureAdded: this.boundingBoxAdded
            }
        );
        this.boxDrawingControl.handler.setOptions({
            'keyMask': OpenLayers.Handler.MOD_ALT,
            'sides': 4,
            'irregular': true
        });
        this.options.map.map.addLayer(this.boxDrawingLayer);
        this.options.map.map.addControl(this.boxDrawingControl);
        this.boxDrawingControl.activate();
    },
    boundingBoxAdded: function(box) {
        var bounds = box.geometry.getBounds();
        var boundingBox = bounds.toArray();
        this.model.set({
            bbox: boundingBox.join()
        });
        // Remove old box
        for(i = 0; i < this.boxDrawingLayer.features.length; i++) {
            if(this.boxDrawingLayer.features[i] != box) {
                this.boxDrawingLayer.features[i].destroy();
            }
        }
    },
    events: _.extend(PopupView.prototype.events, {
        'click input.submit': 'submit',
        'change input': 'changeValue'
    }),
    changeValue: function(event) {
        var data = {};
        if ($(event.target).is('.bbox')) {
            data.bbox = [
                this.$('#bbox-w').val(),
                this.$('#bbox-s').val(),
                this.$('#bbox-e').val(),
                this.$('#bbox-n').val()
            ];
        }
        else {
            data[$(event.target).attr('id')] = $(event.target).val();
        }
        this.model.set(data);
    },
    updateUI: function(model) {
        var that = this;
        _.each(model.changedAttributes(), function(value, key) {
            if (key === 'bbox') {
                var bbox = value.split(',');
                that.$('#bbox-w').val(bbox[0]);
                that.$('#bbox-s').val(bbox[1]);
                that.$('#bbox-e').val(bbox[2]);
                that.$('#bbox-n').val(bbox[3]);
            }
            else {
                that.$('#' + key).val(value);
            }
        });
    },
    submit: function() {
        this.options.collection.add(this.model);
        this.model.save();
        this.close();
        new ExportJobListView({ collection: new ExportJobList });
        return false;
    },
    close: function() {
        this.boxDrawingControl.deactivate();
        this.options.map.map.removeControl(this.boxDrawingControl);
        this.options.map.map.removeLayer(this.boxDrawingLayer);
        $('body').removeClass('exporting');
        this.options.map.minimize();
        PopupView.prototype.close.call(this);
        return false;
    },
});

var ExportJobImageView = ExportJobView.extend({
    initialize: function() {
        _.bindAll(this, 'updateUI');
        this.options.title = 'Export image';
        ExportJobView.prototype.initialize.call(this);
    },
    render: function() {
        ExportJobView.prototype.render.call(this);
        var size = this.options.map.map.getSize();
        var data = {
            filename: this.options.project.get('id') + '.png',
            width: size.w,
            height: size.h,
            aspect: size.w / size.h
        }
        this.model.set(data);
        this.model.bind('change:width', this.updateDimmesions);
        this.model.bind('change:height', this.updateDimmesions);
        this.model.bind('change:aspect', this.updateDimmesions);
    },
    getFields: function() {
        return ich.ExportJobImageView(this.options);
    },
    boundingBoxAdded: function(box) {
        ExportJobView.prototype.boundingBoxAdded.call(this, box);
        var bounds = box.geometry.getBounds();
        this.model.set({aspect: bounds.getWidth() / bounds.getHeight()});
    },
    updateDimmesions: function(model) {
        var attributes = model.changedAttributes();
        if (attributes.width) {
            model.set({
                height: Math.round(attributes.width / model.get('aspect'))},
                {silent: true}
            );
        }
        else if (attributes.height) {
            model.set({
                width: Math.round(model.get('aspect') * attributes.height)},
                {silent: true}
            );
        }
        else if (attributes.aspect) {
            model.set({
                height: Math.round(model.get('width') / attributes.aspect)},
                {silent: true}
            );
        }
    }
});

var ExportJobMBTilesView = ExportJobView.extend({
    initialize: function() {
        _.bindAll(this, 'changeZoomLevels', 'updateZoomLabels');
        this.options.title = 'Export MBTiles';
        ExportJobView.prototype.initialize.call(this);
    },
    render: function() {
        ExportJobView.prototype.render.call(this);
        var slider = this.$('#mbtiles-zoom').slider({
            range: true,
            min:0,
            max:22,
            step:1,
            values: [0, 8],
            slide: this.changeZoomLevels
        });
        this.model.bind('change:minzoom', this.updateZoomLabels);
        this.model.bind('change:maxzoom', this.updateZoomLabels);
        var data = {
            filename: this.options.project.get('id') + '.mbtiles',
            minzoom: 0,
            maxzoom: 8
        }
        this.model.set(data);
    },
    getFields: function() {
        return ich.ExportJobMBTilesView(this.options);
    },
    changeZoomLevels: function(event, ui) {
        this.model.set({
            minzoom: ui.values[0],
            maxzoom: ui.values[1]
        });
    },
    updateZoomLabels: function() {
        this.$('span.min-zoom').text(this.model.get('minzoom'));
        this.$('span.max-zoom').text(this.model.get('maxzoom'));
    }
});

var ExportJobEmbedView = PopupView.extend({
    initialize: function(options) {
        this.options.title = 'Embed';
        this.options.content = ich.ExportJobEmbedView({
            tile_url: this.options.project.layerURL({signed: true}),
        }, true);
        PopupView.prototype.initialize.call(this, options);
    }
});

var exportMethods = {
    ExportJobImage: ExportJobImageView,
    ExportJobMBTiles: ExportJobMBTilesView,
    ExportJobEmbed: ExportJobEmbedView
};
