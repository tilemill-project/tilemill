TileMill.stylesheet = {};

/**
 * Add a stylesheet to the page
 */
TileMill.stylesheet.add = function(options) {
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
            TileMill.stylesheet.setCode($('#tabs .stylesheets a.tab').eq(0), true);
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
  $('#tabs .stylesheets').append(stylesheet);
  // If a position is defined we are adding stylesheets sequentially. Call
  // the for the addition of the next stylesheet.
  if (typeof options.position !== 'undefined') {
    $('Stylesheet', TileMill.settings.mml).eq(options.position + 1).each(function() {
      if ($(this).attr('src')) {
        TileMill.stylesheet.add({src: $(this).attr('src'), position: options.position + 1});
      }
    });
    // If this is the last stylesheet, do final processing.
    if (!$('Stylesheet', TileMill.settings.mml).eq(options.position + 1).size()) {
      $('#tabs .stylesheets').sortable({ axis: 'x', });
    }
  }

  // If not a new stylesheet, load from server.
  if (!options.create) {
    TileMill.backend.get(filename, function(data) {
      $('input', stylesheet).val(data);
      if (options.position === 0) {
        TileMill.stylesheet.setCode(stylesheet);
      }
    });
  }
};

TileMill.stylesheet.save = function(filename, data) {
  TileMill.backend.post(filename, data);
}

TileMill.editor.stylesheet = function() {
  $('Stylesheet:first', TileMill.settings.mml).each(function() {
    if ($(this).attr('src')) {
      TileMill.stylesheet.add({ src: $(this).attr('src'), position: 0 });
    }
  });

  $('#tabs a.tab-add').click(function() {
    $('#popup-stylesheet input:not(.submit)').val('');
    TileMill.popup.show({content:$('#popup-stylesheet'), title:'Add stylesheet'});
    return false;
  });

  $('#popup-stylesheet input.submit').click(function() {
    TileMill.stylesheet.add({src: $('#popup-stylesheet input#stylesheet-name').val(), create: true});
    TileMill.popup.hide();
    return false;
  });
};

TileMill.stylesheet.setCode = function(stylesheet, update) {
  if (!$('#tabs .active').size() || update === true) {
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
