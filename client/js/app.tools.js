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
        this.stylesheetsView = options.stylesheetsView;
    },
    render: function() {
        $(this.el).html(ich.FontPickerToolView({
            fonts: this.model.get('fonts')
        }));
    },
    insertFont: function() {
        var mirror = this.stylesheetsView.activeTab.codemirror;
        mirror.insertIntoLine(
            mirror.cursorPosition().line,
            mirror.cursorPosition().character, '"' + this.$('select').val() + '"');
        $(mirror).focus();
        this.$('select').val('');
    }
});
