var Stylesheet = Backbone.Model.extend({
    initialize: function() {
        // Set default values.
        if (!this.get('data')) {
            this.set({'data': ''});
        }
    }
});

var StylesheetList = Backbone.Collection.extend({
    model: Stylesheet,
    initialize: function(models, options) {
        var self = this;
        this.parent = options.parent;
        this.bind('add', function() {
            this.parent.set({ 'Stylesheet': self });
            this.parent.change();
        });
        this.bind('remove', function() {
            this.parent.set({ 'Stylesheet': self });
            this.parent.change();
        });
    },
});

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

var StylesheetPopupView = PopupView.extend({
    events: _.extend(PopupView.prototype.events, {
        'click input.submit': 'submit',
    }),
    initialize: function(params) {
        this.options.title = 'Add stylesheet';
        this.options.content = ich.StylesheetPopupView({}, true);
        this.render();
    },
    submit: function() {
        var id = $('input.text', this.el).val();
        var stylesheet = new Stylesheet({id: id});
        this.collection.add(stylesheet);
        this.remove();
        return false;
    }
});

var StylesheetTabView = Backbone.View.extend({
    tagName: 'a',
    className: 'tab',
    initialize: function (params) {
        _.bindAll(this, 'render', 'update', 'delete', 'activate', 'remove');

        // Bind an update event that stores the codemirror input contents with
        // the Stylesheet model whenever the project model validate event
        // occurs, indicating that a save/sync is imminent.
        this.model.collection.parent.bind('validate', this.update);

        this.list = params.list;
        this.input = $(ich.StylesheetTabEditor());
        this.codemirror = false;
        this.render();
    },
    render: function () {
        $(this.el).html(ich.StylesheetTabView({ id: this.model.get('id') }));
        $('#editor', this.list.el).append(this.input);
        var colorPicker = new ColorPickerToolView();
        var colorSwatches = new ColorSwatchesToolView();
        var fontPicker = new FontPickerToolView({model: new Abilities, parent: this});
        this.list.$('#tools').append(colorPicker.el);
        this.list.$('#tools').append(fontPicker.el);
        this.list.$('#tools').append(colorSwatches.el);
        return this;
    },
    events: {
        'click .name': 'activate',
        'click .tab-delete': 'delete',
    },
    activate: function() {
        $('#tabs .tab, #editor .editor', this.list.el).removeClass('active');
        $(this.el).addClass('active');
        $(this.input).addClass('active');
        this.list.activeTab = this;
        if (!this.codemirror) {
            this.codemirror = CodeMirror.fromTextArea($('textarea', this.input).get(0), {
                content: this.model.get('data'),
                height: '100%',
                stylesheet: 'css/code.css',
                path: 'js/codemirror/js/',
                parserfile: 'parsemss.js',
                parserConfig: window.data.reference,
                onChange: function() {
                    // TileMill.colors.reload(stylesheets);
                    // TileMill.project.changed();
                },
            });
        }
    },
    delete: function() {
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
    update: function() {
        if (this.codemirror) {
            this.model.set({'data': this.codemirror.getCode()});
        }
    },
    /**
     * Override of .remove(). Removes the input editor element as well.
     */
    remove: function() {
        $(this.el).remove();
        $(this.input).remove();
        return this;
    },
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
        this.$('#farbtastic').farbtastic({
            callback: 'input#color',
            width: 200,
            height: 200
        });
    },
    showPicker: function() {
        this.$('#farbtastic').toggle('fast');
        return false;
    }
});

var ColorSwatchesToolView = Backbone.View.extend({
    id: 'color-swatches',
    initialize: function() {
        this.render();
    },
    render: function() {
        $(this.el).html(ich.ColorSwatchesToolView);
    }
});

var FontPickerToolView = Backbone.View.extend({
    id: 'font-picker',
    events: {
        'change #fonts-list': 'insertFont'
    },
    initialize: function(options) {
        _.bindAll(this, 'render', 'insertFont');
        this.model.fetch({ success: this.render, error: this.render});
        this.parent = options.parent;
    },
    render: function() {
        $(this.el).html(ich.FontPickerToolView({ fonts: this.model.get('fonts') }));
    },
    insertFont: function() {
        var mirror = this.parent.codemirror;
        mirror.insertIntoLine(
          mirror.cursorPosition().line,
          mirror.cursorPosition().character, '"' + this.$('select').val() + '"');
    }
});

/**
 * Init stylesheet editor.
TileMill.stylesheet.init = function() {
  var stylesheets = $(ich.stylesheets({}));

  // Add stylesheets in order.
  var queue = new TileMill.queue();

  TileMill.stylesheet.initFonts();

  var s = TileMill.mml.parseMML(TileMill.data.mml).stylesheets;
  for (var i in s) {
    var src = s[i];
    queue.add(function(src, stylesheets, next) {
      TileMill.stylesheet.add({ src: src }, stylesheets, next);
    }, [src, stylesheets]);
  }
  queue.add(function(stylesheets, next) {
    TileMill.stylesheet.setCode(
        $('a.tab:first', stylesheets),
        false,
        stylesheets);
    $('.stylesheets', stylesheets).sortable({
        axis: 'x',
        change: TileMill.project.changed
    });
    next();
  }, [stylesheets]);
  queue.execute();

  $('a.tab-add', stylesheets).click(function() {
    var popup = $(ich.popup_stylesheet({}));
    TileMill.popup.show({
        content: popup,
        title: 'Add stylesheet'
    });

    $('form', popup).validate({
      errorLabelContainer: 'form .messages',
      submitHandler: function(form) {
        TileMill.stylesheet.add({
            src: $('input#stylesheet-name', form).val(),
            create: true
        });
        TileMill.popup.hide();
        TileMill.project.changed();
        return false;
      }
    });
    return false;
  });
  return stylesheets;
};

TileMill.stylesheet.initFonts = function() {
  TileMill.backend.fonts(function(abilities) {
    _.map(abilities.fonts, function(font) {
      $('#fonts-list').append(ich.font({
        font: font
      }));
    });
    $('#fonts-list').change(function() {
      var position = TileMill.mirror.cursorPosition();
      TileMill.mirror.insertIntoLine(
        position.line,
        position.character, '"' + $(this).val() + '"');
    });
  });
};
 */

/**
 * Add a stylesheet to the page
TileMill.stylesheet.add = function(options, stylesheets, callback) {
  var filename, shortname;
  // If there is no / character, assume this is a single filename.
  if (options.src.split('/').length === 1) {
    shortname = options.src.split('.')[0];
    filename = TileMill.data.type + '/' +
        TileMill.data.id + '/' + shortname + '.mss';
    options.src = TileMill.backend.url(filename);
  } else {
  // Otherwise, assume this is a URL.
    filename = $.url.setUrl(options.src).param('filename');
    shortname = filename.split('/').pop().split('.')[0];
  }

  var stylesheet = $('<a class="tab" href="#tab">')
    .text(shortname)
    .data('tilemill', options)
    .append($('<input type="hidden">').val(' '))
    .append($('<span class="tab-delete">Delete</span>').click(function() {
      if (confirm('Are you sure you want to delete this stylesheet?')) {
        $(this).parents('a.tab').hide('fast', function() {
          // If the deleted tab was active, set the first stylesheet to active.
          if ($(this).is('.active')) {
            TileMill.stylesheet.setCode(
                $('.stylesheets a.tab', stylesheets).eq(0),
                true,
                stylesheets);
          }
          $(this).remove();
          TileMill.project.changed();
        });
      }
      return false;
    }))
    .click(function() {
      TileMill.stylesheet.setCode($(this), true);
      return false;
    });
  $('.stylesheets', stylesheets).append(stylesheet);

  // If not a new stylesheet, load from server.
  if (!options.create) {
    TileMill.backend.get(filename, function(data) {
      $('input', stylesheet).val(data);
      if (callback) {
        callback();
      }
    });
  } else {
    if (callback) {
      callback();
    }
  }
};
 */

/**
 * Set the code editor to edit a specified stylesheet.
TileMill.stylesheet.setCode = function(stylesheet, update, stylesheets) {
  var data;
  if (!$('#tabs .active', stylesheets).size() || update === true) {
    if (!update) {
      $('#tabs a.active').removeClass('active');
      stylesheet.addClass('active');

      data = $('input', stylesheet).val();
      $('#code').val(data);
      $.getJSON('js/data/reference.json', {}, function(data) {
        TileMill.mirror = CodeMirror.fromTextArea('code', {
          height: '100%',
          parserfile: 'parsemss.js',
          parserConfig: data,
          stylesheet: 'css/code.css',
          path: 'js/codemirror/js/',
          onChange: function() {
            TileMill.colors.reload(stylesheets);
            TileMill.project.changed();
          },
          initCallback: function(cm) {
            TileMill.colors.reload(stylesheets);
            TileMill.mirror.grabKeys(
              // callback
              function() { },
              // filter function
              function(code) {
                if (code == 19) {
                  $('div#header a.save').trigger('click');
                  return true;
                } else {
                  return false;
                }
              }
            );
          }
        });
      });
    } else {
      $('#tabs a.active input').val(TileMill.mirror.getCode());
      $('#tabs a.active').removeClass('active');
      stylesheet.addClass('active');

      data = $('input', stylesheet).val();

      var linenum = TileMill.mirror.lineNumber(TileMill.mirror.cursorLine());
      TileMill.mirror.setCode(data);
      TileMill.colors.reload(stylesheets);
      TileMill.mirror.jumpToLine(TileMill.mirror.nthLine(linenum));
    }
  }
};
 */
