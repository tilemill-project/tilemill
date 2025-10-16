view = Backbone.View.extend();

view.prototype.events = {
    'click .actions a[href=#save]': 'save',
    'click .actions a[href^=#export-]': 'exportAdd',
    'click .actions a[href=#exports]': 'exportList',
    'click a[href=#settings]': 'settings',
    'click a[href=#layers]': 'layers',
    'click .breadcrumb .logo': 'unload',
	 'keyup input.search' : 'searchStyles',
    'mousedown .resize-handle': 'startResize'
};

view.prototype.initialize = function() {
    _(this).bindAll(
        'render',
        'attach',
        'error',
        'save',
        'saving',
        'change',
        'exportAdd',
        'exportList',
        'settings',
        'layers',
        'unload',
		  'searchStyles',
        'startResize',
        'doResize',
        'stopResize'
    );
    Bones.intervals = Bones.intervals || {};

    if (Bones.intervals.project) clearInterval(Bones.intervals.project);
    Bones.intervals.project = setInterval(_(function() {
        if (!$('.project').size()) return;
        this.model.poll({ error: function(m, err) {
            new views.Modal(err);
            clearInterval(Bones.intervals.project);
        }});
    }).bind(this), 1000);
    this.dots = '.'
    this.project_checks = 0;
    if (Bones.intervals.projectTile) clearInterval(Bones.intervals.projectTile);
    Bones.intervals.projectTile = setInterval(_(function() {
        if (!$('.project').size()) return;
        this.model.pollTileServer({
            success: _(function(m, resp) {
                if (resp && resp.status) {
                    var name = resp.status+this.dots;
                    $('.workspace .project-status').text(name);
                    this.dots += '.'
                    if (this.dots.split('.').length > 5)
                       this.dots = '.';
                } else {
                    $('.workspace .project-status').text('');
                    this.project_checks++;
                    if (this.project_checks > 2) clearInterval(Bones.intervals.projectTile);
                }
            }).bind(this),
            error: _(function(m, resp) {
                $('.workspace .project-status').text('');
                clearInterval(Bones.intervals.projectTile);
            }).bind(this)
        });
    }).bind(this), 1000);

    window.onbeforeunload = window.onbeforeunload || this.unload;

    this.model.bind('error', this.error);
    this.model.bind('save', this.saving);
    this.model.bind('saved', this.attach);
    this.model.bind('change', this.change);
    this.model.bind('poll', this.attach);
    this.render().attach();
};

view.prototype.render = function(init) {
    $('.bleed .active').removeClass('active');
    $('.bleed .editor')
        .addClass('active')
        .removeClass('disabled')
        .attr('href', '#/project/' + this.model.id);
    $(this.el).html(templates.Project(this.model));

    // Restore saved map width from localStorage
    try {
        var savedMapWidth = localStorage.getItem('tilemill.project.mapWidth');
        if (savedMapWidth) {
            var mapPercent = parseFloat(savedMapWidth);
            var mapEl = this.$('.map')[0];
            if (mapEl) {
                mapEl.style.setProperty('left', '0', 'important');
                mapEl.style.setProperty('width', mapPercent + '%', 'important');
                mapEl.style.setProperty('right', 'auto', 'important');
            }
            var workspaceEl = this.$('.workspace')[0];
            if (workspaceEl) {
                workspaceEl.style.setProperty('left', mapPercent + '%', 'important');
                workspaceEl.style.setProperty('right', '0', 'important');
                workspaceEl.style.setProperty('width', 'auto', 'important');
            }
            this.$('.resize-handle').css('left', mapPercent + '%');
        }
    } catch(e) {
        // LocalStorage may not be available
    }

    // Create map
    this.map = new views.Map({
        el: this.$('.map'),
        model: this.model
    });

    return this;
};

view.prototype.attach = function() {
    $(this.el).removeClass('saving');
    this.$('.workspace .name').text(this.model.get('name')||this.model.id);
    this.$('.actions a[href=#save]').addClass('disabled');
};

view.prototype.change = function() {
    this.$('.actions a[href=#save]').removeClass('disabled');
};

view.prototype.error = function() {
    $(this.el).removeClass('saving');
};

view.prototype.save = function() {
    if (this.$('.actions a[href=#save]').is('.disabled')) return false;
    this.model.save();
    return false;
};

view.prototype.saving = function(ev) {
    $(this.el).addClass('saving');
};

view.prototype.settings = function(ev) {
    this.$('.project').addClass('meta');
    new views.Metadata({
        el: $('#meta'),
        type: 'tiles',
        model: this.model,
        project: this.model,
        title: 'Project settings',
        success: _(function() {
            this.$('#meta').empty();
            this.$('.project').removeClass('meta');
        }).bind(this),
        cancel: _(function() {
            this.$('#meta').empty();
            this.$('.project').removeClass('meta');
        }).bind(this)
    });
    return false;
};

view.prototype.exportAdd = function(ev) {
    this.$('.project').addClass('meta');
    var format = $(ev.currentTarget).attr('href').split('#export-').pop();
    new views.Metadata({
        el: $('#meta'),
        type: (format === 'sync' || format === 'mbtiles') ? 'tiles' : 'image',
        model: new models.Export({
            id: format === 'sync' ? this.model.id : undefined,
            format: format,
            project: this.model.id
        }),
        project: this.model,
        title: $(ev.currentTarget).attr('title'),
        success: _(function() {
            this.$('#meta').empty();
            this.$('.project').removeClass('meta');
            if (!$('#drawer').is('.active')) {
                $('a[href=#exports]').click();
            }
            this.exportList();
        }).bind(this),
        cancel: _(function() {
            this.$('#meta').empty();
            this.$('.project').removeClass('meta');
        }).bind(this)
    });
    return false;
};

// Create a global reference to the exports collection on the Bones
// object. Ensures that export polling only ever occurs against one
// collection.
view.prototype.exportList = function(ev) {
    $('#drawer').addClass('loading');
    var projectModel = this.model;
    Bones.models = Bones.models || {};
    Bones.models.exports = Bones.models.exports || new models.Exports();
    Bones.models.exports.fetch({
        success: function(collection) {
            $('#drawer').removeClass('loading');
            new views.Exports({
                collection: collection,
                project: projectModel,
                el: $('#drawer')
            });
        },
        error: function(m, e) {
            $('#drawer').removeClass('loading');
            new views.Modal(e);
        }
    });
};

view.prototype.layers = function(ev) {
    new views.Layers({
        el: $('#drawer'),
        model: this.model,
        map: this.map
    });
};

// This handler may be called from *anywhere* since we don't have a chance to
// unbind when handling the beforeunload event. Check that we are indeed on a
// project view when doing this.
view.prototype.unload = function(ev) {
    if (!$('.project').size()) return;
    if ($('.actions a.disabled[href=#save]').size()) return;
    if (ev && ev.metaKey) return;

    var message = 'You have unsaved changes. Are you sure you want to close this project?';
    if (ev && ev.type === 'beforeunload') return message;
    if (confirm(message)) return true;
    return false;
};

view.prototype.searchStyles = function(ev) {
	var val = this.$("input.search").val() || "";
	val = val.toLowerCase();

	if (val == "") {
		for (var i=0;i<this.model.get("Stylesheet").models.length;i++) {
			this.model.get("Stylesheet").models[i].codemirror.clearGutter("search");
		}
		$('.workspace .search-results').text("");
		return;
	}
	var searchResults = 0;
	for (var i=0;i<this.model.get("Stylesheet").models.length;i++) {
		var model = this.model.get("Stylesheet").models[i];
		var lines = model.get("data").split("\n");
		model.codemirror.clearGutter("search");

		for (var j=0;j<lines.length;j++) {
			if (lines[j].toLowerCase().indexOf(val) != -1) {
				var marker = document.createElement("div");
				marker.className = "search-marker";
				model.codemirror.setGutterMarker(j, 'search', marker);
				searchResults++;
			}
		}
	}
	$('.workspace .search-results').text(" " + searchResults);
}

// Resize handle functionality
view.prototype.startResize = function(ev) {
    ev.preventDefault();
    this.resizing = true;
    this.startX = ev.pageX;
    this.startMapWidth = this.$('.map').width();
    this.containerWidth = this.$('.project').width();
    
    this.$('.project').addClass('resizing');
    $(document).bind('mousemove', this.doResize);
    $(document).bind('mouseup', this.stopResize);
    
    return false;
};

view.prototype.doResize = function(ev) {
    if (!this.resizing) return;
    
    var delta = ev.pageX - this.startX;
    var newMapWidth = this.startMapWidth + delta;
    var mapPercent = (newMapWidth / this.containerWidth) * 100;
    
    // Constrain between 20% and 80%
    mapPercent = Math.max(20, Math.min(80, mapPercent));
    
    // Update map: set width and ensure right is auto (so width takes effect)
    var mapEl = this.$('.map')[0];
    if (mapEl) {
        mapEl.style.setProperty('left', '0', 'important');
        mapEl.style.setProperty('width', mapPercent + '%', 'important');
        mapEl.style.setProperty('right', 'auto', 'important');
    }
    
    // Update workspace: set left position and keep right:0 (width auto-calculated)
    var workspaceEl = this.$('.workspace')[0];
    if (workspaceEl) {
        workspaceEl.style.setProperty('left', mapPercent + '%', 'important');
        workspaceEl.style.setProperty('right', '0', 'important');
        workspaceEl.style.setProperty('width', 'auto', 'important');
    }
    
    this.$('.resize-handle').css('left', mapPercent + '%');
    
    // Trigger map resize/refresh if available
    if (this.map && this.map.map) {
        // Try different map refresh methods
        if (typeof this.map.map.invalidateSize === 'function') {
            this.map.map.invalidateSize();
        } else if (typeof this.map.map.refresh === 'function') {
            this.map.map.refresh();
        } else if (typeof this.map.updateMap === 'function') {
            this.map.updateMap();
        }
    }
    
    // Trigger tabs bar resize to adjust visible tabs
    if (this.stylesheets && typeof this.stylesheets.resizeTabsBar === 'function') {
        this.stylesheets.resizeTabsBar();
    }
};

view.prototype.stopResize = function(ev) {
    if (!this.resizing) return;
    
    this.resizing = false;
    this.$('.project').removeClass('resizing');
    $(document).unbind('mousemove', this.doResize);
    $(document).unbind('mouseup', this.stopResize);
    
    // Save the preference to localStorage
    var mapPercent = parseFloat(this.$('.map').css('width')) / this.containerWidth * 100;
    try {
        localStorage.setItem('tilemill.project.mapWidth', mapPercent);
    } catch(e) {
        // LocalStorage may not be available
    }
    
    // Final tabs bar resize after drag complete
    if (this.stylesheets && typeof this.stylesheets.resizeTabsBar === 'function') {
        this.stylesheets.resizeTabsBar();
    }
};
