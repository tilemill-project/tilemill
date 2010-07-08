TileMill.stylesheet = {};

/**
 * Add a stylesheet to the page
 */
TileMill.stylesheet.add = function(options) {
  // If there is no / character, assume this is a single filename.
  if (options.src.split('/').length === 1) {
    var filename = options.src.split('.')[0];
    options.src = TileMill.settings.server + TileMill.settings.type + '/mss?id='+ TileMill.settings.project_id +'&filename='+ filename;
  }
  // Otherwise, assume this is a URL.
  else {
    var filename = $.url.setUrl(options.src).param('filename');
  }

  var stylesheet = $('<a class="tab" href="#tab">')
    .text(filename)
    .data('tilemill', options)
    .append($('<input type="hidden">').val(' '))
    .append($('<span class="tab-delete">Delete</span>').click(function() {
      if (confirm('Are you sure you want to delete this stylesheet?')) {
        $(this).parents('a.tab').hide('fast', function() {
          $(this).remove();
          // Set the first stylesheet to active.
          TileMill.initCodeEditor($('#tabs .stylesheets a.tab').eq(0), true);
        });
      }
      return false;
    }))
    .click(function() {
      TileMill.initCodeEditor($(this), true);
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
    $.get(options.src, function(data) {
      $('input', stylesheet).val(data);
      if (options.position === 0) {
        TileMill.initCodeEditor(stylesheet);
      }
    });
  }
};

TileMill.stylesheet.save = function(file, data) {
  $.post(TileMill.settings.server + TileMill.settings.type + '/mss', {
    'id': TileMill.settings.project_id,
    'filename': file,
    'data': data
  });
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
