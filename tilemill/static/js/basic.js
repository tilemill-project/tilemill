var TileMill = TileMill || { settings:{}, page:0, uniq: (new Date().getTime()), editor: {}, basic: {} };

$.fn.reverse = [].reverse;

TileMill.save = function() {
  // No need to save MML, it's always the same.
  var stylesheet = "Map {\n  map-bgcolor: #fff;\n}\n#world {\n  polygon-fill: #eee;\n  line-color: #ccc;\n  line-width: 0.5;\n}\n#inspect {\n  polygon-fill: #83bc69;\n  line-color: #333;\n  line-width: 0.5;\n}";

  if (TileMill.basic.label) {
    stylesheet += "\n#inspect " + TileMill.basic.label + "{\n  text-face-name: \"DejaVu Sans Book\";\n  text-fill: #333;\n  text-size: 9;\n}";
  }
  // Todo: implement chloropleth, unique value.
  TileMill.stylesheet.save(TileMill.settings.project_id, stylesheet);
  TileMill.uniq = (new Date().getTime());
  TileMill.map.reload();
}

$(function() {
  $('div#header a.save').click(function() {
    TileMill.save();
    return false;
  });

  $('div#header a.info').click(function() {
    $('#popup-info input#tilelive-url').val(TileMill.settings.tilelive + 'tile/' + TileMill.mml.url({ timestamp: false, encode: true }));
    $('#popup-info input#project-mml-url').val(TileMill.mml.url({ timestamp: false, encode: false }));
    TileMill.popup.show({content: $('#popup-info'), title: 'Info'});
    return false;
  });
  TileMill.inspector.loadCallback = function(data) {
    $('.layer-inspect-loading').removeClass('layer-inspect-loading').addClass('layer-inspect');
    for (field in data['inspect']) {
      (function(field, data) {
        var li = $('<li>')
          .attr('id', 'field-' + field)
          .append($('<a class="inspect-label" href="#inspect-label">Label</a>').click(function() {
            TileMill.basic.label = field;
            TileMill.save();
            return false;
          }))
          .append($('<a class="inspect-chloropleth" href="#inspect-chloropleth">Chloropleth</a>').click(function() {
            TileMill.basic.visualizationField = field;
            TileMill.basic.visualizationType = 'chloropleth';
            TileMill.save();
            return false;
          }))
          .append($('<a class="inspect-unique" href="#inspect-unique">Unique Value</a>').click(function() {
            TileMill.basic.visualizationField = field;
            TileMill.basic.visualizationType = 'unique';
            TileMill.save();
            return false;
          }))
          .append($('<a class="inspect-values" href="#inspect-values">See values</a>').click(function() {
            TileMill.inspector.values(field, 'inspect');
            return false;
          }))
          .append('<strong>' + field + '</strong>')
          .append('<em>' + data['inspect'][field].replace('int', 'integer').replace('str', 'string') + '</em>')
          .appendTo($('#inspector ul.sidebar-content'));
      })(field, data);
    }
  };
  TileMill.inspector.load();
  $('#layers').hide();
});
