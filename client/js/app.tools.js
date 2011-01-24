var StylesheetTools = Backbone.View.extend({
    id: 'stylesheet-tools',
    className: 'view',
    initialize: function(options) {
        _.bindAll(this, 'render');
        this.render();
    },
    render: function(){
        $(this.el).html(ich.StylesheetTools);
    },
    events: {
        'click .show-fonts' : 'showFonts',
        'click .show-colors' : 'showColors'
    },
    showFonts: function(){
        $('a.show-colors').removeClass('active').addClass('inactive');
        var self = $('a.show-fonts', this.el);
        if(self.hasClass('inactive')){
            self.removeClass('inactive')
                .addClass('active');
            $('#colors', this.el).hide();
            $('#fonts', this.el).show();
        }
        return false;
    },
    showColors: function(){
        $('a.show-fonts').removeClass('active').addClass('inactive');
        var self = $('a.show-colors', this.el);
        if(self.hasClass('inactive')){
            self.removeClass('inactive')
                .addClass('active');
            $('#fonts', this.el).hide();
            $('#colors', this.el).show();
        }
        return false;
    }
});

var ColorPickerToolView = Backbone.View.extend({
    id: 'color-picker',
    initialize: function(options) {
        _.bindAll(this, 'activate', 'pickerChange', 'pickerShow', 'pickerHide');
        this.colorChanged = false;
        this.project = options.project;
        this.render();
        window.app.bind('ready', this.activate);
    },
    render: function() {
        $(this.el).html(ich.ColorPickerToolView);
    },
    activate: function() {
        var that = this,
            visible = false;
        this.colorpicker = $('a', this.el).ColorPicker({
            eventName: 'toggle',
            onChange: that.pickerChange,
            onShow: that.pickerShow,
            onHide: that.pickerHide
        }).bind('click', function() {
            if (!visible) {
                $(this).trigger('toggle');
                visible = true;
            }
            else {
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
        var selection = this.project.view.stylesheets.activeTab.codemirror.selection();
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
            if (mirror.selection().match(/\#[A-Fa-f0-9]{6}\b|\#[A-Fa-f0-9]{3}\b/g)) {
                mirror.replaceSelection('#' + this.colorChanged);
            }
            else if (mirror.selection().match(/^[A-Fa-f0-9]{6}\b|^[A-Fa-f0-9]{3}\b/g)) {
                mirror.replaceSelection(this.colorChanged);
            }
            this.colorChanged = false;
        }
    }
});

var ColorSwatch = Backbone.Model.extend({
    initialize: function() {
        this.set({ hsl: this.RGBToHSL(this.unpack(this.get('hex'))) });
    },
    /**
     * From farbtastic.
     */
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
    }
});

var ColorSwatchesList = Backbone.Collection.extend({
    model: ColorSwatch,
    initialize: function(models, options) {
        _.bindAll(this, 'reload');
        this.project = options.project;
        this.project.bind('codeMirrorChange', this.reload);
        this.project.bind('ready', this.reload);
    },
    reload: function() {
        var matches = this.project.get('Stylesheet').pluck('data')
            .join('\n').match(/\#[A-Fa-f0-9]{6}\b|\#[A-Fa-f0-9]{3}\b/g);
        if (!matches) {
            matches = [];
        }
        matches = _.uniq(matches);

        var hexMap = {}
        this.each(function(swatch) { hexMap[swatch.get('hex')]  = swatch; });

        // Get list of models to remove.
        var remove = _.without.apply(this, [this.pluck('hex')].concat(matches));
        var that = this;
        _.each(remove, function(hex) {
            that.remove(hexMap[hex]);
        })

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
        // Trigger the deferred add event
        this.trigger('add');
    },
    /**
     * Sort swatches by lightness.
     */
    comparator: function(swatch) {
        return swatch.get('hsl')[2];
    }
});

var ColorSwatchesToolView = Backbone.View.extend({
    id: 'colors',
    className: 'view',
    initialize: function(options) {
        _.bindAll(this, 'render', 'createSwatchView');
        this.collection.bind('add', this.render);
        this.collection.bind('remove', this.del);
        this.project = options.project;
        $(this.el).html(ich.ColorSwatchesToolView());
    },
    render: function() {
        var that = this;
        var pointer = null;
        this.collection.each(function(swatch) {
            if (!swatch.view) {
                swatch.view = new ColorSwatchView({
                    model: swatch,
                    project:that.project
                });
                if (!pointer) {
                    self.$('.swatches').prepend(swatch.view.el);
                }
                else {
                    $(pointer).after(swatch.view.el);
                }
            }
            pointer = swatch.view.el;
        });
    },
    del: function(swatch) {
        swatch.view.remove();
    }
});

var ColorSwatchView = Backbone.View.extend({
    events: {
        'click': 'insertHex'
    },
    initialize: function(options) {
        _.bindAll(this, 'render', 'insertHex');
        this.project = options.project;
        this.render();
    },
    render: function() {
       $(this.el).html(ich.ColorSwatchView({color: this.model.get('hex')}));
       return this;
    },
    insertHex: function() {
        var mirror = this.project.view.stylesheets.activeTab.codemirror;
        var pos = mirror.cursorPosition();
        var hex = this.model.get('hex');
        if (mirror.lineContent(pos.line).charAt(pos.character-1) == '#') {
            mirror.replaceSelection(hex.slice(1));
        }
        else {
            mirror.replaceSelection(hex);
        }
        $(mirror).focus();
        return false;
    }
});

var FontPickerToolView = Backbone.View.extend({
    id: 'font-picker',
    events: {
        'change #fonts': 'insertFont'
    },
    initialize: function(options) {
        _.bindAll(this, 'render', 'insertFont');
        this.project = options.project;
        this.model.fetch({
            success: this.render,
            error: this.render
        });
    },
    //@TODO Having Some trouble here - will work on this in the morning :(
    render: function() {
        
        $(this.el).html(ich.FontPickerToolView({
            fonts: this.model.get('fonts')
        }));
        
        var $input = $('input', this.el),
            $list = $('font-list'),
            formTitle = $input.attr('title');
            
        // Returns a case-insensitive contains()
        jQuery.expr[':'].Contains = function(a,i,m){
            return (a.textContent || a.innerText || "").toUpperCase().indexOf(m[3].toUpperCase())>=0;
        };
        $input.change( function () {
            var filter = $input.val();
            if(filter) {
                $list.find('a:not(:Contains(' + filter + '))').parent().slideUp();
                $list.find('a:Contains(' + filter + ')').parent().slideDown();
            } else {
                $list.find('li').slideDown();
            }
            return false;
        })
        .keyup( function () {
            $(this).change();
        });
             
        function remove() {
          if ($input.val() === formTitle) {
            $input.val('');
          }
        }
        $input.blur(function () {
          $input.val(formTitle);
        }).focus(remove).blur();
        //Also remove if ..
        $input.submit(remove);
        $(window).unload(remove); // For Firefox
    },
    insertFont: function() {
        var mirror = this.project.view.stylesheets.activeTab.codemirror;
        var value = this.$('input').val();
      if(value !== 'Filter list' && value !== '') {
        mirror.replaceSelection('"' + this.$('input').val() + '"');
        $(mirror).focus();
        this.$('input').val(''); 
      }
    }
});
