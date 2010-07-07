TileMill.stylesheet = {};

/**
 * Add a stylesheet to the page
 */
TileMill.stylesheet.add = function(options) {
  // If there is no / character, assume this is a single filename.
  if (options.src.split('/').length === 1) {
    var filename = options.src.split('.')[0];
    options.src = TileMill.settings.server + 'projects/mss?id='+ TileMill.settings.project_id +'&filename='+ filename;
  }
  // Otherwise, assume this is a URL.
  else {
    var filename = $.url.setUrl(options.src).param('filename');
  }
  // Get one at a time.
  $.get(options.src, function(data) {
    // Add the stylesheet to the page.
    var stylesheet = $('<a class="tab" href="#tab">')
      .text(filename)
      .data('tilemill', options)
      .append($('<input type="hidden">').val(data))
      .append($('<span class="tab-delete">Delete</span>').click(function() {
        if (confirm('Are you sure you want to delete this stylesheet?')) {
          $(this).parents('a.tab').hide('fast', function() {
            if ($(this).is('.active')) {
              // Set the first stylesheet to active.
              TileMill.initCodeEditor($('#tabs a.tab').eq(0), true);
            }
            $(this).remove();
          });
        }
        return false;
      }))
      .click(function() {
        TileMill.initCodeEditor($(this), true);
        return false;
      })
      .appendTo($('#tabs'));

    // If a position is defined we are adding stylesheets sequentially. Call
    // the for the addition of the next stylesheet.
    if (typeof options.position !== 'undefined') {
      TileMill.initCodeEditor(stylesheet);
      $('Stylesheet', TileMill.settings.mml).eq(options.position + 1).each(function() {
        if ($(this).attr('src')) {
          TileMill.stylesheet.add({src: $(this).attr('src'), position: options.position + 1});
        }
      });
      // If this is the last stylesheet, do final processing.
      if (!$('Stylesheet', TileMill.settings.mml).eq(options.position + 1).size()) {
        $('#tabs').sortable({ axis: 'x', });
      }
    }
  });
};

TileMill.stylesheet.save = function(file, data) {
  $.post('/projects/mss', {
    'id': TileMill.settings.project_id,
    'filename': file,
    'data': data
  });
}

$(function() {
  $('Stylesheet:first', TileMill.settings.mml).each(function() {
    if ($(this).attr('src')) {
      TileMill.stylesheet.add({ src: $(this).attr('src'), position: 0 });
    }
  });
});
