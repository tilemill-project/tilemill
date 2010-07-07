TileMill.initColors = function() {
  TileMill.farbtastic = $.farbtastic($('#farbtastic'), {callback:'input#color', width:200, height:200});
  $('#color-picker a.color-picker').click(function() {
    $('#farbtastic').toggle('fast');
  });
};

TileMill.reloadColors = function(data) {
  matches = data.match(/\#[A-Fa-f0-9]{3,6}/g);
  colors = [];
  for (i = 0; i < matches.length; i++) {
    color = TileMill.farbtastic.RGBToHSL(TileMill.farbtastic.unpack(matches[i]));
    color.push(matches[i]);
    pass = false;
    for (key in colors) {
      if (colors[key][3] == matches[i]) {
        pass = true;
      }
    }
    if (!pass) {
      colors.push(color);
    }
  }
  colors.sort(function(a, b) { return a[2] - b[2] });
  $('div#colors div').empty();
  for (color in colors) {
    $('div#colors div').append($("<a href='#' class='swatch' style='background-color: "+ colors[color][3] +"'><label>"+ colors[color][3] +"</label></a>").click(function() {
      TileMill.insert($(this).text());
    }));
  }
}

TileMill.insert = function(text) {
  var position = TileMill.mirror.cursorPosition();
  TileMill.mirror.insertIntoLine(position.line, position.character, text);
}

$(function() {
  TileMill.initColors();
});