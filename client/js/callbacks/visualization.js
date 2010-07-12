TileMill.controller.visualization = function() {
  var id = $.bbq.getState("id");
  TileMill.backend.get('visualization/' + id + '/' + id + '.mml', function(mml) {

    // Store current settings. @TODO: Refactor this.
    TileMill.settings.mml = mml;
    TileMill.settings.id = id;
    TileMill.settings.type = 'visualization';
    TileMill.settings.filename = 'visualization/' + id + '/' + id + '.mml';

    // Set the unique query string.
    TileMill.uniq = (new Date().getTime());

    TileMill.show(TileMill.template('visualization', {id: id}));

    var inspector = TileMill.inspector.init();
    var map = TileMill.map.init();

    $('#sidebar').append(inspector);
    $('body').append(map);

    // Init elements which require DOM presence.
    TileMill.map.initOL(map, TileMill.backend.servers(TileMill.mml.url()), {navigation: 1, fullscreen: 1, zoom: 1, panzoombar: 1});

    // Load, inspect queue
    var queue = new TileMill.queue;
    queue
      .add(function(next) { TileMill.inspector.load(next); })
      .add(function(next) { TileMill.inspector.inspect('inspect', true); })
      .execute();
  });
};

TileMill.visualization = {};

TileMill.visualization.attach = function(field, type, li) {
  if (type === 'float' || type === 'int') {
    $('a.inspect-choropleth', li).click(function() {
      return false;
    });
    $('a.inspect-scaled-points', li).click(function() {
      return false;
    });
  }
  else {
    $('a.inspect-choropleth, a.inspect-scaled-points', li).remove();
  }
  $('a.inspect-label', li).click(function() {
    return false;
  });
  $('a.inspect-unique', li).click(function() {
    return false;
  });
};

TileMill.visualization.save = function() {
};

TileMill.visualization.add = function(url) {
  var name = url.split('/').pop().split('.')[0];
  var queue = new TileMill.queue();
  queue.add(function(name, next) {
    var filename = 'visualization/' + name;
    TileMill.backend.add(filename, next);
  }, [name]);
  queue.add(function(name, next) {
    var mss = 'visualization/' + name + '/' + name + '.mss';
    var data = TileMill.mss.generate({
      'Map': {
        'map-bgcolor': '#fff',
      },
      '#world': {
        'polygon-fill': '#eee',
        'line-color': '#ccc',
        'line-width': '0.5',
      },
      '#inspect': {
        'polygon-fill': '#83bc69',
        'line-color': '#333',
        'line-width': '0.5',
      },
    });
    TileMill.backend.post(mss, data, next);
  }, [name]);
  queue.add(function(name, next) {
    var mss = 'visualization/' + name + '/' + name + '.mss';
    var mml = 'visualization/' + name + '/' + name + '.mml';
    var data = TileMill.mml.generate({
      stylesheets: [TileMill.backend.url(mss)],
      layers:[
        {
          id: 'world',
          srs: 'WGS84',
          file: 'http://cascadenik-sampledata.s3.amazonaws.com/world_borders.zip',
          type: 'shape',
        },
        {
          id: 'inspect',
          srs: 'WGS84',
          file: url,
          type: 'shape',
        }
      ],
    });
    TileMill.backend.post(mml, data, next);
  }, [name]);
  queue.add(function(name) {
    $.bbq.pushState({ 'action': 'visualization', 'id': name });
  }, [name]);
  queue.execute();
};

$(function() {
  $('div#header a.save').click(function() {
    TileMill.save();
    return false;
  });

  $('div#header a.info').click(function() {
    $('#popup-info input#tilelive-url').val(TileMill.settings.tilelive.split(',')[0] + 'tile/' + TileMill.mml.url({ timestamp: false, encode: true }));
    $('#popup-info input#project-mml-url').val(TileMill.mml.url({ timestamp: false, encode: false }));
    TileMill.popup.show({content: $('#popup-info'), title: 'Info'});
    return false;
  });
  TileMill.inspector.loadCallback = function(data) {
    $('.layer-inspect-loading').removeClass('layer-inspect-loading').addClass('layer-inspect');
    for (field in data['inspect'].fields) {
      (function(field, data) {
        var li = $('<li>')
          .attr('id', 'field-' + field)
          .append($('<a class="inspect-unique" href="#inspect-unique">Unique Value</a>').click(function() {
            if ($(this).is('.active')) {
              delete TileMill.basic.visualizationField;
              delete TileMill.basic.visualizationType;
              $(this).removeClass('active');
            }
            else {
              TileMill.basic.visualizationField = field;
              TileMill.basic.visualizationType = 'unique';
              $('#inspector a.inspect-choropleth, #inspector a.inspect-unique').removeClass('active');
              $(this).addClass('active');
            }
            TileMill.save();
            return false;
          }))
          .append($('<a class="inspect-values" href="#inspect-values">See values</a>').click(function() {
            TileMill.inspector.values(field, 'inspect');
            return false;
          }))
          .append($('<a class="inspect-label" href="#inspect-label">Label</a>').click(function() {
            if ($(this).is('.active')) {
              delete TileMill.basic.label;
              $(this).removeClass('active');
            }
            else {
              TileMill.basic.label = field;
              $('#inspector a.inspect-label').removeClass('active');
              $(this).addClass('active');
            }
            TileMill.save();
            return false;
          }));
        // Only show choropleth for int and float fields.
        if (data['inspect'].fields[field] == 'int' || data['inspect'].fields[field] == 'float') {
          li.append($('<a class="inspect-choropleth" href="#inspect-choropleth">Choropleth</a>').click(function() {
            if ($(this).is('.active')) {
              delete TileMill.basic.visualizationField;
              delete TileMill.basic.visualizationType;
              $(this).removeClass('active');
            }
            else {
              TileMill.basic.visualizationField = field;
              TileMill.basic.visualizationType = 'choropleth';
              $('#inspector a.inspect-choropleth, #inspector a.inspect-unique').removeClass('active');
              $(this).addClass('active');
            }
            TileMill.save();
            return false;
          })).append($('<a class="inspect-scaled-points" href="#inspect-scaled-points">Scaled points</a>').click(function() {
            if ($(this).is('.active')) {
              delete TileMill.basic.scaledPoints;
              $(this).removeClass('active');
            }
            else {
              TileMill.basic.scaledPoints = field;
              $('#inspector a.inspect-scaled-points').removeClass('active');
              $(this).addClass('active');
            }
            TileMill.save();
            return false;
          }));
        }
        li.append('<strong>' + field + '</strong>')
          .append('<em>' + data['inspect'].fields[field].replace('int', 'integer').replace('str', 'string') + '</em>')
          .appendTo($('#inspector ul.sidebar-content'));

      })(field, data);
    }
    var src = $('Stylesheet:first', TileMill.settings.mml).attr('src');
    // If there is no / character, assume this is a single filename.
    if (src.split('/').length === 1) {
      src = TileMill.settings.server + 'projects/mss?id='+ TileMill.settings.project_id +'&filename='+ filename;
    }
    $.get(src, function(data) {
      var settings = eval('(' + data.match(/(.+)/)[0].replace('/*', '').replace('*/', '') + ')');
      if (settings.label != 'undefined') {
        TileMill.basic.label = settings.label;
        $('#field-' + settings.label).find('.inspect-label').addClass('active');
      }
      if (settings.visualizationField != 'undefined' && settings.visualizationType != 'undefined') {
        TileMill.basic.visualizationField = settings.visualizationField;
        TileMill.basic.visualizationType = settings.visualizationType;
        $('#field-' + settings.visualizationField).find('.inspect-' + settings.visualizationType).addClass('active');
      }
      if (settings.choroplethSplit != 'undefined') {
        TileMill.basic.choroplethSplit = settings.choroplethSplit;
        $('#popup-info select#choroplethSplit').val(TileMill.basic.choroplethSplit);
      }
      else {
        TileMill.basic.choroplethSplit = 5;
      }
      if (settings.scaledPoints != 'undefined') {
        TileMill.basic.scaledPoints = settings.scaledPoints;
        $('#field-' + settings.scaledPoints).find('.inspect-scaled-points').addClass('active');
      }
    });
  };
  TileMill.inspector.load();
  $('#layers').hide();

  $('div#header a.info').click(function() {
    $('#popup-info input#tilelive-url').val(TileMill.settings.tilelive + 'tile/' + TileMill.mml.url({ timestamp: false, encode: true }));
    $('#popup-info input#project-mml-url').val(TileMill.mml.url({ timestamp: false, encode: false }));
    $('#popup-info select#choroplethSplit').val(TileMill.basic.choroplethSplit);
    TileMill.popup.show({content: $('#popup-info'), title: 'Info'});
    return false;
  });

  $('#popup-info select#choroplethSplit').change(function() {
    TileMill.basic.choroplethSplit = $(this).val();
    TileMill.save();
  });

  $('a.projectify').click(function() {
    TileMill.popup.show({content: $('#popup-projectify'), title: 'Save'});
    return false;
  });
  $('#popup-projectify input.submit').click(function() {
    $(this).unbind('click');
    TileMill._save = function() {
      var template = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n\
<!DOCTYPE Map[\n\
  <!ENTITY srs900913 \"+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs\">\n\
  <!ENTITY srsWGS84 \"+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs\">\n\
]>\n\
<Map srs=\"&srs900913;\">\n\
  <Stylesheet src=\"{{ stylesheet }}\" />\n\
  <Layer id=\"world\" srs=\"&srsWGS84;\">\n\
    <Datasource>\n\
      <Parameter name=\"file\">http://cascadenik-sampledata.s3.amazonaws.com/world_borders.zip</Parameter>\n\
      <Parameter name=\"type\">shape</Parameter>\n\
      <Parameter name=\"id\">world</Parameter>\n\
    </Datasource>\n\
  </Layer>\n\
  <Layer id=\"data\" srs=\"{{ srs }}\">\n\
    <Datasource>\n\
      <Parameter name=\"file\">{{ url }}</Parameter>\n\
      <Parameter name=\"type\">shape</Parameter>\n\
      <Parameter name=\"id\">data</Parameter>\n\
    </Datasource>\n\
  </Layer>\n\
</Map>";
      $.post(TileMill.settings.server + 'projects/new', { 'name': $('#project-name').val() }, function() {
        var replaced = TileMill.basic.stylesheet.replace(/#inspect/g, '#data');
        $.post(TileMill.settings.server + 'projects/mss', {
          'id': $('#project-name').val(),
          'filename': $('#project-name').val(),
          'data': replaced
        }, function() {
          $.get(TileMill.settings.server + 'visualizations/mml', {
            'id': TileMill.settings.project_id,
          }, function(data) {
            var $inspect = $(data).find('Layer#inspect');
            var fill = template.replace('{{ stylesheet }}', TileMill.settings.server + 'projects/mss?id=' + $('#project-name').val() + '&amp;filename=' + $('#project-name').val() + '&amp;c=' + (new Date().getTime()))
              .replace('{{ srs }}', $inspect.attr('srs'))
              .replace('{{ url }}', $inspect.find('parameter[name=file]').html());
            $.post(TileMill.settings.server + 'projects/mml', {
              'id': $('#project-name').val(),
              'data': fill
            }, function() {
              window.location = TileMill.settings.server + 'projects/edit?id=' + $('#project-name').val();
            });
          });
        });
      });
    };
    TileMill.save(true);
    return false;
  });
});

TileMill.save = function(projectify) {
  // No need to save MML, it's always the same.
  if (!projectify) {
    TileMill.basic.stylesheet = "/* { 'label': '" + TileMill.basic.label + "', 'visualizationType': '" + TileMill.basic.visualizationType + "', 'visualizationField': '" + TileMill.basic.visualizationField + "', 'choroplethSplit': '" + TileMill.basic.choroplethSplit + "', 'scaledPoints': '" + TileMill.basic.scaledPoints + "' } */\n";
  }

  TileMill.basic.stylesheet += "Map {\n  map-bgcolor: #fff;\n}\n#world {\n  polygon-fill: #eee;\n  line-color: #ccc;\n  line-width: 0.5;\n}\n#inspect {\n  polygon-fill: #83bc69;\n  line-color: #333;\n  line-width: 0.5;\n}";

  if (TileMill.basic.label) {
    TileMill.basic.stylesheet += "\n#inspect " + TileMill.basic.label + " {\n  text-face-name: \"DejaVu Sans Book\";\n  text-fill: #333;\n  text-size: 9;\n}";
  }

  if (TileMill.basic.visualizationType == 'choropleth' || TileMill.basic.visualizationType == 'unique') {
    var field = TileMill.basic.visualizationField;
    if (TileMill.inspector.valueCache[field]) {
      TileMill.basic[TileMill.basic.visualizationType](TileMill.inspector.valueCache[field]);
    }
    else {
      TileMill.inspector.values(field, 'inspect', 'TileMill.basic.' + TileMill.basic.visualizationType, (TileMill.basic.visualizationType == 'unique' ? 50 : false), 50);
    }
  }
  else {
    TileMill._save();
  }
}

TileMill._save = function() {
  // scaledPoints
  if (TileMill.basic.scaledPoints) {
    var field = TileMill.basic.scaledPoints;
    if (TileMill.inspector.valueCache[field]) {
      TileMill.scaledPoints(TileMill.inspector.valueCache[field]);
    }
    else {
      TileMill.inspector.values(field, 'inspect', 'TileMill.scaledPoints', 50);
    }
  }
  else {
    TileMill.__save();
  }
}

TileMill.scaledPoints = function(data) {
  var range = Math.abs(data.max - data.min),
    individual = range / 10,
    sizes = { 0: 2, 1: 4, 2: 6, 3: 9, 4: 13, 5: 18, 6: 25, 7: 34, 8: 45, 9: 60 };
  for (i = 0; i < 10; i++) {
    TileMill.basic.stylesheet += "\n#inspect[" + TileMill.basic.scaledPoints + ">=" + data.min + (individual * i) + "] {\n  point-file: url(" + TileMill.settings.server.substr(0,TileMill.settings.server.length-1) + TileMill.settings.static_path + 'images/points/' + i  + ".png);\n  point-width: " + sizes[i] + ";\n  point-height: " + sizes[i] + ";\n}";
  }
  TileMill.__save();
}

TileMill.__save = function() {
  TileMill.stylesheet.save(TileMill.settings.project_id, TileMill.basic.stylesheet);
  TileMill.uniq = (new Date().getTime());
  TileMill.map.reload();
}

TileMill.basic.choropleth = function(data) {
  var range = Math.abs(data.max - data.min),
    split = (TileMill.basic.choroplethSplit && TileMill.basic.choroplethSplit != 'undefined' ? TileMill.basic.choroplethSplit : 5);
    individual = range / split,
    colors = {
    2: ['#fd5', '#e57e57'],
    3: ['#fd5', '#f2af56', '#e57e57'],
    4: ['#fd5', '#f2af56', '#e57e57', '#b27082'],
    5: ['#fd5', '#f2af56', '#e57e57', '#c57071', '#9f7094'],
    6: ['#fd5', '#f2af56', '#e68457', '#cf7068', '#ae7086', '#8e70a4'],
    7: ['#fd5', '#f4b556', '#ea9256', '#e07058', '#c47072', '#a8708b', '#8e70a4'],
    8: ['#fd5', '#f6bc56', '#ee9e56', '#e57e57', '#d27065', '#bc707a', '#a5708f', '#8e70a4'],
    9: ['#fd5', '#f7c156', '#f0a656', '#e88b57', '#e07058', '#cb706b', '#b7707e', '#a27091', '#8e70a4'],
    10: ['#fd5', '#f9c655', '#f1ab56', '#eb9456', '#e47b57', '#d67061', '#c57071', '#b27083', '#a07093', '#8e70a4']
  };
  for (i = 0; i < split; i++) {
    TileMill.basic.stylesheet += "\n#inspect[" + TileMill.basic.visualizationField + ">=" + data.min + (individual * i) + "] {\n  polygon-fill: " + colors[split][i] + ";\n}";
  }
  TileMill._save();
}

TileMill.basic.unique = function(data) {
  var colors = [
      '#e17057',
      '#95e47a',
      '#9095e3',
      '#c7658b',
      '#eba15f',
      '#7cd0a1',
      '#8e70a4',
      '#ffdd55',
      '#85ced7',
      '#f397a4'
    ], processed = [], colorValues = {};
  for (i = 0; i < data.values.length; i++) {
    var pass = false;
    for (j = 0; j < processed.length; j++) {
      if (processed[j] == data.values[i]) {
        pass = true;
        continue;
      }
    }
    if (!pass) {
      var color = colors[i % colors.length];
      if (colorValues[color]) {
        colorValues[color].push(data.values[i]);
      }
      else {
        colorValues[color] = [data.values[i]];
      }
      processed.push(data.values[i]);
    }
  }
  for (var color in colorValues) {
    for (var value = 0; value < colorValues[color].length; value++) {
      if (value != 0) {
        TileMill.basic.stylesheet += ',';
      }
      TileMill.basic.stylesheet += "\n#inspect[" + TileMill.basic.visualizationField + "='" + colorValues[color][value] + "']";
    }
    TileMill.basic.stylesheet += " {\n  polygon-fill: " + color + ";\n}";
  }
  TileMill._save();
}
