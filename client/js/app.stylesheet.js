/**
 * Model: Stylesheet
 *
 * This model is *not* backed directly by the server.
 * It is a child model of Project and is saved serialized as part of the parent
 * Project model.
 */
var Stylesheet = Backbone.Model.extend({
    initialize: function() {
        if (!this.get('data')) {
            this.set({'data': ''});
        }
    },
    validate: function() {
        if (/^[a-z0-9\-_.]+$/i.test(this.id) === false) {
            return 'Name must contain only letters, numbers, dashes, underscores and periods.';
        }
    }
});

/**
 * Collection: StylesheetList
 *
 * This collection is *not* backed directly by the server.
 * This collection is a child of the Project model. When it is updated
 * (add/remove events) it updates the attributes of its parent model as well.
 */
var StylesheetList = Backbone.Collection.extend({
    model: Stylesheet,
    initialize: function(models, options) {
        var self = this;
        this.parent = options.parent;
        this.bind('change', function() {
            this.parent.set({ 'Stylesheet': self });
            this.parent.change();
        });
        this.bind('add', function() {
            this.parent.set({ 'Stylesheet': self });
            this.parent.change();
        });
        this.bind('remove', function() {
            this.parent.set({ 'Stylesheet': self });
            this.parent.change();
        });
    }
});

/**
 * View: StylesheetListView
 *
 * Display a StylesheetList collection as a set of tabs.
 */
var StylesheetListView = Backbone.View.extend({
    initialize: function() {
        _.bindAll(this, 'render', 'add', 'activate');
        var self = this;
        this.collection.bind('add', this.render);
        this.collection.bind('add', this.activate);
        this.collection.bind('remove', this.render);
        this.collection.bind('remove', this.activate);
        window.app.bind('ready', this.activate);
        this.render();
        /*
        @TODO: bind re-render to project events.
        */
    },
    render: function() {
        // Render the stylesheets wrapper if not present.
        if ($(this.el).has('.stylesheets').length === 0) {
            $(this.el).html(ich.StylesheetListView());
            $('.stylesheets', this.el).sortable({
                axis: 'x',
                revert: true,
                containment: 'parent'
                // @TODO: proper event.
                // change: TileMill.project.changed
            });
        }

        // Add a tab view for each stylesheet.
        var self = this;
        this.collection.each(function(stylesheet) {
            if (!stylesheet.view) {
                stylesheet.view = new StylesheetTabView({
                    model: stylesheet,
                    list: self
                });
                $('.stylesheets', self.el).append(stylesheet.view.el);
                self.activeTab = self.activeTab || stylesheet.view;
            }
        });
        return this;
    },
    activate: function() {
        if (this.activeTab) {
            this.activeTab.activate();
        }
    },
    events: {
        'click .tab-add': 'add'
    },
    add: function() {
        new StylesheetPopupView({collection: this.collection});
        return false;
    }
});

/**
 * View: StylesheetTabView
 *
 * Display a Stylesheet as a tab within a StylesheetListView.
 */
var StylesheetTabView = Backbone.View.extend({
    tagName: 'a',
    className: 'tab',
    initialize: function(params) {
        _.bindAll(this, 'render', 'update', 'del', 'activate', 'remove');
        this.list = params.list;
        this.input = $(ich.StylesheetTabEditor());
        this.tools = $(ich.StylesheetTools());
        this.codemirror = false;
        this.render();
    },
    render: function() {
        $(this.el).html(ich.StylesheetTabView({ id: this.model.get('id') }));
        $('#editor', this.list.el).append(this.input);

        /*
        Merge: @TODO update corresponding code in app.project.js
        var colorPicker = new ColorPickerToolView({
            model: this.model
        });
        var colorSwatches = new ColorSwatchesToolView({
            collection: new ColorSwatchesList(null, { parent: this }),
            parent: this,
        });
        var fontPicker = new FontPickerToolView({
            model: new Abilities,
            parent: this
        });
        $(this.tools).append(colorPicker.el);
        $(this.tools).append(fontPicker.el);
        $(this.tools).append(colorSwatches.el);
        */

        return this;
    },
    events: {
        'click .name': 'activate',
        'click .tab-delete': 'del'
    },
    activate: function() {
        var self = this;

        $('#tabs .tab, #editor .editor', this.list.el).removeClass('active');
        $(this.el).addClass('active');
        $(this.input).addClass('active');
        $(this.tools).addClass('active');
        this.list.activeTab = this;
        if (!this.codemirror) {
            this.codemirror = CodeMirror.fromTextArea($('textarea', this.input).get(0), {
                content: this.model.get('data'),
                height: '100%',
                stylesheet: 'css/code.css',
                path: 'js/codemirror/js/',
                parserfile: 'parsemss.js',
                parserConfig: window.data.reference,
                saveFunction: function() {
                    self.model.collection.parent.view.saveProject();
                },
                onCursorActivity: function() {
                    self.model.set({'data': self.codemirror.getCode()});
                },
                onChange: function() {
                    self.model.collection.parent.change();
                },
                initCallback: function(cm) {
                    self.model.collection.parent.trigger('ready');
                }
            });
        }
    },
    del: function() {
        window.app.loading();
        if (confirm('Are you sure you want to delete this stylesheet?')) {
            this.list.collection.remove(this.model);
            this.remove();
            window.app.done();
        }
        else {
            window.app.done();
        }
        return false;
    },
    /**
     * Override of .remove(). Removes the input editor element as well.
     */
    remove: function() {
        $(this.el).remove();
        $(this.input).remove();
        return this;
    }
});

var ColorPickerToolView = Backbone.View.extend({
    id: 'color-picker',
    className: 'pane',
    events: {
        'click a.color-picker': 'showPicker'
    },
    initialize: function() {
        _.bindAll(this, 'activate', 'showPicker');
        this.render();
        window.app.bind('ready', this.activate);
    },
    render: function() {
        $(this.el).html(ich.ColorPickerToolView);
    },
    activate: function() {
        var farb = $('.tilemill-farbtastic', this.el);
        this.farbtastic = $.farbtastic(farb, {
            callback: 'input.color',
            width: 200,
            height: 200
        });
    },
    showPicker: function() {
        this.$('.tilemill-farbtastic').toggle('fast');
        return false;
    }
});

var ColorSwatch = Backbone.Model.extend({
    initialize: function() {
        this.set({ hsl: this.RGBToHSL(this.unpack(this.get('hex'))) });
    },
    /* From farbtastic */
    RGBToHSL: function (rgb) {
      var r = rgb[0], g = rgb[1], b = rgb[2],
          min = Math.min(r, g, b),
          max = Math.max(r, g, b),
          delta = max - min,
          h = 0,
          s = 0,
          l = (min + max) / 2;
      if (l > 0 && l < 1) {
        s = delta / (l < 0.5 ? (2 * l) : (2 - 2 * l));
      }
      if (delta > 0) {
        if (max == r && max != g) h += (g - b) / delta;
        if (max == g && max != b) h += (2 + (b - r) / delta);
        if (max == b && max != r) h += (4 + (r - g) / delta);
        h /= 6;
      }
      return [h, s, l];
    },
    unpack: function (color) {
      if (color.length == 7) {
        function x(i) {
          return parseInt(color.substring(i, i + 2), 16) / 255;
        }
        return [ x(1), x(3), x(5) ];
      }
      else if (color.length == 4) {
        function x(i) {
          return parseInt(color.substring(i, i + 1), 16) / 15;
        }
        return [ x(1), x(2), x(3) ];
      }
    },
    url: function() {
        return '/foo';
    }
});

var ColorSwatchesList = Backbone.Collection.extend({
    model: ColorSwatch,
    initialize: function(models, options) {
        this.parent = options.parent;
        _.bindAll(this, 'reload');
        this.parent.model.collection.parent.bind('change', this.reload);
        this.parent.model.collection.parent.bind('ready', this.reload);
    },
    reload: function() {
        var matches = this.parent.model.collection.pluck('data').join('\n').match(/\#[A-Fa-f0-9]{3,6}/g);
        if (matches) {
            // Clear collection
            var coll = this;
            this.forEach(function(color) {
                coll.remove(color);
            });
            for (var i = 0; i < matches.length; i++) {
                var pass = false;
                this.forEach(function(color) {
                    if (color.get('hex') == matches[i]) {
                        pass = true;
                    }
                });
                if (!pass) {
                    this.add(new ColorSwatch({hex: matches[i]}));
                }
            }
        }
    }
});

var ColorSwatchesToolView = Backbone.View.extend({
    id: 'color-swatches',
    initialize: function(options) {
        _.bindAll(this, 'render', 'activate', 'reload');
        this.parent = options.parent;
        this.render();
    },
    render: function() {
        $(this.el).html(ich.ColorSwatchesToolView);
    }
});

var FontPickerToolView = Backbone.View.extend({
    className: 'font-picker pane',
    events: {
        'change .fonts-list': 'insertFont'
    },
    initialize: function(options) {
        _.bindAll(this, 'render', 'insertFont');
        this.model.fetch({
            success: this.render,
            error: this.render
        });
        this.parent = options.parent;
    },
    render: function() {
        $(this.el).html(ich.FontPickerToolView({
            fonts: this.model.get('fonts')
        }));
    },
    insertFont: function() {
        var mirror = this.parent.codemirror;
        mirror.insertIntoLine(
            mirror.cursorPosition().line,
            mirror.cursorPosition().character, '"' + this.$('select').val() + '"');
        $(mirror).focus();
        this.$('select').val('');
    }
});

/**
 * View: StylesheetPopupView
 *
 * Popup form for adding a new stylesheet.
 */
var StylesheetPopupView = PopupView.extend({
    events: _.extend(PopupView.prototype.events, {
        'click input.submit': 'submit'
    }),
    initialize: function(params) {
        this.options.title = 'Add stylesheet';
        this.options.content = ich.StylesheetPopupView({}, true);
        this.render();
    },
    submit: function() {
        var id = $('input.text', this.el).val();
        var stylesheet = new Stylesheet({id: id});
        var error = stylesheet.validate();
        if (error) {
            window.app.message('Error', error);
        }
        else {
            this.collection.add(stylesheet);
            this.remove();
        }
        return false;
    }
});

