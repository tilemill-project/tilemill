TileMill.colors = {};

/**
 * Initialize colors - initialize colorpicker.
 */
TileMill.colors.init = function() {
  return $(ich.color({}));
};

TileMill.colors.initFarb = function(color) {
  var farb = $('#farbtastic', color);
  TileMill.colors.farbtastic = $.farbtastic(farb, {
      callback: 'input#color',
      width: 200,
      height: 200
  });

  $('a.color-picker', color).click(function() {
    farb.toggle('fast');
    return false;
  });
};

/**
 * Reload the color palatte. Find all color references and display a palette of
 * all unique colors.
 */
TileMill.colors.reload = function(stylesheets) {
  // Collect text from all tabs.
  var data = [];
  $('a.tab:not(.active) input', stylesheets).each(function() {
    data.push($(this).val());
  });
  data.push(TileMill.mirror.getCode());
  data = data.join('\n');

  var colors = [];
  var colors_div = $('div#colors div').empty();
  var matches = data.match(/\#[A-Fa-f0-9]{3,6}/g);
  if (matches) {
    for (var i = 0; i < matches.length; i++) {
      // Split up the color into an HSL triplet.
      var color = TileMill.colors.farbtastic.RGBToHSL(
          TileMill.colors.farbtastic.unpack(matches[i]));
      // Add the RGB to the color.
      color.push(matches[i]);
      var pass = false;
      for (var key in colors) {
        if (colors[key][3] == matches[i]) {
          pass = true;
          continue;
        }
      }
      if (!pass) {
        colors.push(color);
      }
    }
    // Sort the colors by lightness.
    colors.sort(function(a, b) { return a[2] - b[2]; });

    // Go through the colors and add them to the color palette. When one is
    // clicked, it's inserted into the document at the current cursor.
    $.each(colors, function(key, value) {
      colors_div.append(
        $(ich.color_swatch({
            color: value[3]
        })));
    });
    $('a', colors_div).click(function() {
      return TileMill.colors.insert($(this).text());
    });
  }
};

/**
 * Insert a color into the document
 */
TileMill.colors.insert = function(color) {
  var s = false;
  if (s = TileMill.mirror.selection()) {
    // don't add double hashes if selection contains hash
    TileMill.mirror.replaceSelection(
      s.match(/#/) ? color : color.slice(1));
  } else {
    var position = TileMill.mirror.cursorPosition();
    TileMill.mirror.insertIntoLine(
      position.line,
      position.character, color);
  }
  return false;
};
