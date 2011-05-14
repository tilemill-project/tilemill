// StylesheetTools
// ---------------
// View. Tools for inserting font and color values into a stylesheet.
var StylesheetTools = TabsView.extend({
    id: 'StylesheetTools',
    className: 'view',
    initialize: function(options) {
        this.options.tabs = [];
        this.options.tabs.push({
            id: 'ColorSwatchListView',
            title: 'Colors',
            active: true,
            content: new ColorSwatchListView({
                collection: new ColorSwatchList(null, this.options),
                project: this.options.project
            })
        });
        this.options.tabs.push({
            id: 'FontPicker',
            title: 'Fonts',
            active: false,
            content: new FontPicker({
                model: window.app.abilities,
                project: this.options.project
            })
        });
        TabsView.prototype.initialize.call(this, options);
    },
    events: _.extend({
        'click .show-fonts' : 'showFonts',
        'click .show-colors' : 'showColors'
    }, TabsView.prototype.events),
    showFonts: function() {
        $('a.show-colors').removeClass('active').addClass('inactive');
        var self = $('a.show-fonts', this.el);
        if (self.hasClass('inactive')) {
            self.removeClass('inactive')
                .addClass('active');
            $('#ColorSwatchListView', this.el).hide();
            $('#FontPicker', this.el).show();
        }
        return false;
    },
    showColors: function() {
        $('a.show-fonts').removeClass('active').addClass('inactive');
        var self = $('a.show-colors', this.el);
        if (self.hasClass('inactive')) {
            self.removeClass('inactive')
                .addClass('active');
            $('#FontPicker', this.el).hide();
            $('#ColorSwatchListView', this.el).show();
        }
        return false;
    }
});

// ColorSwatch
// -----------
// Model. A single color swatch.
var ColorSwatch = Backbone.Model.extend({
    initialize: function(params) {
        var rgb = this.unpack(params.color);
        this.set({
            color: this.pack(rgb),
            hsl: this.RGBToHSL(rgb)
        });
    },
    // Compare this color to another color, normalizing the formatting
    // of each to avoid duplicates.
    eq: function(other) {
        return this.pack(this.unpack(other)) == this.get('color');
    },
    // # From farbtastic.
    RGBToHSL: function(rgb) {
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
    dec2hex: function(x) {
        return (x < 16 ? '0' : '') + x.toString(16);
    },
    // Given a [r, g, b, a?] array, return a CSS-formatted
    // color string.
    pack: function(rgb) {
        var r = Math.round(rgb[0] * 255);
        var g = Math.round(rgb[1] * 255);
        var b = Math.round(rgb[2] * 255);
        if (rgb.length <= 3 || rgb[3] === 1) {
            return '#' + this.dec2hex(r) + this.dec2hex(g) + this.dec2hex(b);
        } else {
            return 'rgba(' + r + ',' + g + ',' + b + ',' + rgb[3] + ')';
        }
    },
    unpack: function(color) {
        if (color[0] === '#' && color.length == 7) {
            var x = function(i) {
                return parseInt(color.substring(i, i + 2), 16) / 255;
            }
            return [x(1), x(3), x(5)];
        }
        else if (color[0] === '#' && color.length == 4) {
            var x = function(i) {
                return parseInt(color.substring(i, i + 1), 16) / 15;
            }
            return [x(1), x(2), x(3)];
        }
        else {
            return _.map(color.match(/^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*((?:0?\.)?\d+))?\s*\)$/).slice(1),
                function(c, i) {
                    if (i < 3) return Math.min(255, parseInt(c, 10)) / 255;
                    else return c ? Math.min(1, +c) : 1;
                });
        }
    }
});

// ColorSwatchList
// ---------------
// Collection. List of ColorSwatch models.
var ColorSwatchList = Backbone.Collection.extend({
    model: ColorSwatch,
    initialize: function(models, options) {
        _.bindAll(this, 'reload');
        this.project = options.project;
        this.project.bind('ready', this.reload);
        this.project.bind('save', this.reload);
    },
    reload: function() {
        // Find all color-like strings in all of the stylesheets
        // available from this project.
        var matches = this.project.get('Stylesheet').pluck('data')
            .join('\n').match(/\#[A-Fa-f0-9]{6}\b|\#[A-Fa-f0-9]{3}\b|\b(rgb\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)|rgba\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*(0?\.)?\d+\s*\))/g) || [];

        // Eliminate obvious duplicate colors.
        matches = _.uniq(matches);

        var colorMap = {};
        this.each(function(swatch) { colorMap[swatch.get('color')] = swatch; });

        // Get list of models to remove.
        var remove = _.without.apply(this, [this.pluck('color')].concat(matches));
        var that = this;
        _.each(remove, function(color) {
            that.remove(colorMap[color]);
        });

        // Add all of the matches that aren't already in this
        // collection to this collection, making sure that there aren't
        // any differently-formatted (#f00 vs #FF0000) duplicates
        for (var i = 0; i < matches.length; i++) {
            if (!this.find(function(color) {
                return color.eq(matches[i]);
            })) {
                this.add(new ColorSwatch({ color: matches[i] }));
            }
        }
        // Trigger the deferred add event
        this.trigger('add');
    },
    // Sort swatches by lightness.
    comparator: function(swatch) {
        return swatch.get('hsl')[2];
    }
});

// ColorSwatchListView
// -------------------
// View. Displays all colors in a project as a set of color swatches.
var ColorSwatchListView = Backbone.View.extend({
    id: 'ColorSwatchListView',
    className: 'view',
    initialize: function(options) {
        _.bindAll(this, 'render', 'createSwatchView', 'activate', 'pickerChange', 'pickerShow', 'pickerHide');
        this.collection.bind('add', this.render);
        this.collection.bind('remove', this.del);
        this.colorChanged = false;
        this.project = options.project;
        this.render();
        window.app.bind('ready', this.activate);
    },
    render: function() {
        !this.$('.swatches').size() && $(this.el).html(ich.ColorSwatchListView());

        var that = this;
        var pointer = null;
        this.collection.each(function(swatch) {
            if (!swatch.view) {
                swatch.view = new ColorSwatchView({
                    model: swatch,
                    project: that.project
                });
                if (!pointer) {
                    self.$('.swatches').prepend(swatch.view.el);
                } else {
                    $(pointer).after(swatch.view.el);
                }
            }
            pointer = swatch.view.el;
        });
    },
    del: function(swatch) {
        swatch.view.remove();
    },
    activate: function() {
        var that = this,
            visible = false;
        this.colorpicker = this.$('a.color-picker').ColorPicker({
            eventName: 'toggle',
            onChange: that.pickerChange,
            onShow: that.pickerShow,
            onHide: that.pickerHide
        }).bind('click', function() {
            if (!visible) {
                $(this).trigger('toggle');
                visible = true;
            } else {
                visible = false;
            }
            return false;
        });
        $(document).bind('click', function() {
            visible = false;
        });
    },
    pickerChange: function(hsb, hex, rgb) {
        this.colorChanged = hex;
    },
    pickerShow: function() {
        var selection = this.project.view.stylesheets.activeTab.codemirror.getSelection();
        if (selection.match(/\#[A-Fa-f0-9]{6}\b|\#[A-Fa-f0-9]{3}\b/g)) {
            $(this.colorpicker).ColorPickerSetColor(
                selection.substring(1, selection.length));
        }
        else if (selection.match(/[A-Fa-f0-9]{6}\b|[A-Fa-f0-9]{3}\b/g)) {
            $(this.colorpicker).ColorPickerSetColor(selection);
        }
    },
    pickerHide: function(hsb, hex, rgb) {
        if (this.colorChanged) {
            var mirror = this.project.view.stylesheets.activeTab.codemirror;
            if (mirror.getSelection()
                .match(/\#[A-Fa-f0-9]{6}\b|\#[A-Fa-f0-9]{3}\b/g)) {
                mirror.replaceSelection('#' + this.colorChanged);
            }
            else if (mirror.getSelection()
                .match(/^[A-Fa-f0-9]{6}\b|^[A-Fa-f0-9]{3}\b/g)) {
                mirror.replaceSelection(this.colorChanged);
            }
            this.colorChanged = false;
        }
    }
});

// ColorSwatchView
// ---------------
// View. Single color swatch.
var ColorSwatchView = Backbone.View.extend({
    events: {
        'click': 'insertColor'
    },
    initialize: function(options) {
        _.bindAll(this, 'render', 'insertColor');
        this.project = options.project;
        this.render();
    },
    render: function() {
       $(this.el).html(ich.ColorSwatchView({ color: this.model.get('color') }));
       return this;
    },
    insertColor: function() {
        if (window.app.settings.get('mode') === 'minimal') return false;

        var mirror = this.project.view.stylesheets.activeTab.codemirror,
            pos = mirror.getCursor();
            color = this.model.get('color');
        if (mirror.getLine(pos.line).charAt(pos.ch - 1) === '#' && color[0] === '#') {
            mirror.replaceSelection(color.slice(1));
        } else {
            mirror.replaceSelection(color);
        }
        $(mirror).focus();
        return false;
    }
});

// FontPicker
// ----------
// View. Font selection list.
var FontPicker = Backbone.View.extend({
    id: 'FontPicker',
    events: {
        'click ul.fonts-list li': 'insertFont'
    },
    initialize: function(options) {
        _.bindAll(this, 'render', 'insertFont');
        this.project = options.project;
        this.render();
    },
    render: function() {
        $(this.el).html(ich.FontPicker({
            fonts: this.model.get('fonts')
        }));

        var input = $('input', this.el),
            list = $('ul.fonts-list', this.el),
            formTitle = input.attr('title');

        // Returns a case-insensitive contains()
        jQuery.expr[':'].Contains = function(a,i,m) {
            return (a.textContent || a.innerText || '').toUpperCase().indexOf(m[3].toUpperCase()) >= 0;
        };

        input.keyup(function() {
            input.trigger('change');
        });
        input.change(function() {
            var filter = $(this).val();

            if (filter) {
                list.find('li:not(:Contains(' + filter + '))').fadeOut('fast');
                list.find('li:Contains(' + filter + ')').show();
            } else {
                list.find('li').show();
            }
            return false;
        });

        input
        .blur(function() {
            input.val(formTitle);
        })
        .focus(function() {
            if (input.val() === formTitle) {
                input.val('');
            }
        })
        .blur();
    },
    insertFont: function(ev) {
        if (window.app.settings.get('mode') === 'minimal') return false;

        var mirror = this.project.view.stylesheets.activeTab.codemirror,
            value = this.$(ev.target).text();
        mirror.replaceSelection('"' + value + '"');
        $(mirror).focus();
    }
});

