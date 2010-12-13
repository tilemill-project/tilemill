TileMill.stylesheet = {};

/**
 * Init stylesheet editor.
 */
TileMill.stylesheet.init = function() {
  var stylesheets = $(TileMill.template('stylesheets', {}));

  // Add stylesheets in order.
  var queue = new TileMill.queue();

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
    var popup = $(TileMill.template('popup-stylesheet', {}));
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

/**
 * Add a stylesheet to the page
 */
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

/**
 * Save a stylesheet to the backend.
 */
TileMill.stylesheet.save = function(filename, data, callback) {
  TileMill.backend.post(filename, data, callback);
};

/**
 * Get the time-modified of a stylesheet
 */
TileMill.stylesheet.mtime = function(filename, callback) {
  TileMill.backend.mtime(filename, callback);
};

/**
 * Set the code editor to edit a specified stylesheet.
 */
TileMill.stylesheet.setCode = function(stylesheet, update, stylesheets) {
  var data;
  if (!$('#tabs .active', stylesheets).size() || update === true) {
    if (!update) {
      $('#tabs a.active').removeClass('active');
      stylesheet.addClass('active');

      data = $('input', stylesheet).val();
      $('#code').val(data);
      TileMill.mirror = CodeMirror.fromTextArea('code', {
        height: '100%',
        parserfile: 'parsecss.js',
        stylesheet: 'css/code.css',
        path: 'js/codemirror/js/',
        onChange: function() {
          TileMill.colors.reload(stylesheets);
          TileMill.project.changed();
        },
        initCallback: function() {
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
    } else {
      $('#tabs a.active input').val(TileMill.mirror.getCode());
      $('#tabs a.active').removeClass('active');
      stylesheet.addClass('active');

      data = $('input', stylesheet).val();

      var linenum = TileMill.mirror.lineNumber(TileMill.mirror.cursorLine());
      TileMill.mirror.setCode(data);
      TileMill.colors.reload(stylesheets);
      TileMill.mirror.jumpToLine(TileMill.mirror.nthLine(linenum));;
    }
  }
};
