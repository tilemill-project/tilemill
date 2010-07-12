TileMill.stylesheet = {};

/**
 * Init stylesheet editor.
 */
TileMill.stylesheet.init = function() {
  var stylesheets = $(TileMill.template('stylesheets', {}));

  // Add stylesheets in order.
  var queue = new TileMill.queue();
  var s = TileMill.mml.parseMML(TileMill.settings.mml).stylesheets;
  for (var i in s) {
    var src = s[i];
    queue.add(function(src, stylesheets, next) {
      TileMill.stylesheet.add({src: src}, stylesheets, next);
    }, [src, stylesheets]);
  }
  queue.add(function(stylesheets, next) {
    TileMill.stylesheet.setCode($('a.tab:first', stylesheets), false, stylesheets);
    $('.stylesheets', stylesheets).sortable({ axis: 'x', });
    next();
  }, [stylesheets]);
  queue.execute();

  $('a.tab-add', stylesheets).click(function() {
    var popup = $(TileMill.template('popup-stylesheet', {}));
    $('input.submit', popup).click(function() {
      TileMill.stylesheet.add({src: $('#popup-stylesheet input#stylesheet-name').val(), create: true});
      TileMill.popup.hide();
      return false;
    });
    TileMill.popup.show({content:popup, title:'Add stylesheet'});
    return false;
  });
  return stylesheets;
};

/**
 * Add a stylesheet to the page
 */
TileMill.stylesheet.add = function(options, stylesheets, callback) {
  // If there is no / character, assume this is a single filename.
  if (options.src.split('/').length === 1) {
    var shortname = options.src.split('.')[0];
    var filename = TileMill.settings.type + '/' + TileMill.settings.id + '/' + shortname + '.mss';
    options.src = TileMill.backend.url(filename);
  }
  // Otherwise, assume this is a URL.
  else {
    var filename = $.url.setUrl(options.src).param('filename');
    var shortname = filename.split('/').pop().split('.')[0];
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
            TileMill.stylesheet.setCode($('.stylesheets a.tab', stylesheets).eq(0), true, stylesheets);
          }
          $(this).remove();
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
  }
  else {
    if (callback) {
      callback();
    }
  }
};

TileMill.stylesheet.save = function(filename, data) {
  TileMill.backend.post(filename, data);
}

TileMill.stylesheet.setCode = function(stylesheet, update, stylesheets) {
  if (!$('#tabs .active', stylesheets).size() || update === true) {
    if (!update) {
      $('#tabs a.active').removeClass('active');
      stylesheet.addClass('active');

      var data = $('input', stylesheet).val();
      $('#code').val(data);
      TileMill.mirror = CodeMirror.fromTextArea('code', {
        height: "100%",
        parserfile: "parsecss.js",
        stylesheet: "css/code.css",
        path: "js/codemirror/js/"
      });
      setInterval(function() {
        TileMill.colors.reload(TileMill.mirror.getCode());
      }, 5000);
      TileMill.colors.reload(data);
    }
    else {
      $('#tabs a.active input').val(TileMill.mirror.getCode());
      $('#tabs a.active').removeClass('active');
      stylesheet.addClass('active');

      var data = $('input', stylesheet).val();
      TileMill.mirror.setCode(data);
      TileMill.colors.reload(data);
    }
  }
};
