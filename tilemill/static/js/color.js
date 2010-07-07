TileMill.colors = {};

/**
 * Initialize colors - initialize colorpicker.
 */
TileMill.colors.init = function() {
  var farb = $('#farbtastic');
  TileMill.colors.farbtastic = $.farbtastic(farb, { callback:'input#color', width:200, height:200 });

  $('#color-picker a.color-picker').click(function() {
    farb.toggle('fast');
    return false;
  });
};

/**
 * Reload the color palatte.
 */
TileMill.colors.reload = function(data) {
  // Find all colors.
  var matches = data.match(/\#[A-Fa-f0-9]{3,6}/g),
  // Keep track of unique colors.
    colors = [];
  for (var i = 0; i < matches.length; i++) {
    // Split up the color into an HSL triplet.
    var color = TileMill.colors.farbtastic.RGBToHSL(TileMill.colors.farbtastic.unpack(matches[i]));
    // Add the RGB to the color.
    color.push(matches[i]);
    var pass = false;
    for (var key in colors) {
      if (colors[key][3] == matches[i]) {
        pass = true;
      }
    }
    if (!pass) {
      colors.push(color);
    }
  }
  // Sort the colors by lightness.
  colors.sort(function(a, b) { return a[2] - b[2] });

  var colors_div = $('div#colors div').empty();
  // Go through the colors and add them to the color palette. When one is
  // clicked, it's inserted into the document at the current cursor.
  for (var color in colors) {
    colors_div
      .append($("<a href='#' class='swatch' style='background-color: "+ colors[color][3] +"'><label>"+ colors[color][3] +"</label></a>")
        .click(function() {
          TileMill.colors.insert($(this).text());
        }));
  }
}

/**
 * Insert a color into the document
 *
 * @TODO Make this much better (replace selections etc).
 */
TileMill.colors.insert = function(color) {
  var position = TileMill.mirror.cursorPosition();
  TileMill.mirror.insertIntoLine(position.line, position.character, color);
}

$(function() {
  TileMill.colors.init();
});