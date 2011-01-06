var Stylesheet = Backbone.Model.extend({
    initialize: function() {
        // Set default values.
        if (!this.get('data')) {
            this.set({'data': ''});
        }
    }
});

var StylesheetList = Backbone.Collection.extend({
    model: Stylesheet
});

var StylesheetListView = Backbone.View.extend({
    initialize: function() {
        _.bindAll(this, 'render');
        this.collection.bind('all', this.render);
        this.render();
        /*
        @TODO: bind re-render to project events.
        */
    },
    render: function() {
        var self = this;
        $(this.el).html(ich.StylesheetListView());
        this.collection.each(function(stylesheet) {
            var stylesheetTab = new StylesheetTabView({
                model: stylesheet,
                list: self
            });
            $('.stylesheets', self.el).append(stylesheetTab.el);
        });
        $('.stylesheets', self.el).sortable({
          axis: 'x'
          // @TODO: proper event.
          // change: TileMill.project.changed
        });

        return this;
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
        _.bindAll(this, 'render');
        this.render();
        this.list = params.list;
        this.input = $('textarea', this.el);
        this.input.val(this.model.get('data'));
        this.codemirror = false;
    },
    render: function () {
        $(this.el).html(ich.StylesheetTabView({ id: this.model.get('id') }));
        return this;
    },
    events: {
        'click .name': 'activate',
        'click .tab-delete': 'delete',
    },
    activate: function() {
        $('.stylesheets a.tab', this.list.el).removeClass('active');
        $('#editor', this.list.el).append(this.input);
        $(this.el).addClass('active');
        if (!this.codemirror) {
            return;
            this.codemirror = CodeMirror.fromTextArea('code', {
                height: '100%',
                stylesheet: 'css/code.css',
                path: 'js/codemirror/js/',
                parserfile: 'parsemss.js',
                parserConfig: window.data.reference,
                /*
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
                */
            });
        }

        /*
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
        */
    },
    delete: function() {
        alert('@TODO delete');
        return false;
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
