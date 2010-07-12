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

    // Init the visualization state.
    TileMill.visualization.init(TileMill.mml.parseMML(mml));

    // Load, inspect queue
    var queue = new TileMill.queue;
    queue
      .add(function(next) { TileMill.inspector.load(next); })
      .add(function(next) { TileMill.inspector.inspect('inspect', true); })
      .execute();

    $('div#header a.save').click(function() {
      TileMill.visualization.save();
      return false;
    });

    $('div#header a.info').click(function() {
      var tilelive_url = TileMill.backend.servers(TileMill.mml.url())[0] + 'tile/' + TileMill.mml.url({ timestamp: false, encode: true });
      var mml_url = TileMill.mml.url({ timestamp: false, encode: false });
      var popup = $(TileMill.template('popup-info-visualization', {tilelive_url: tilelive_url, mml_url: mml_url}));
      $('select#choropleth-split', popup)
        .change(function() {
          TileMill.visualization.settings.choroplethSplit = $(this).val();
          TileMill.visualization.save();
        })
        .val(TileMill.visualization.settings.choroplethSplit);
      TileMill.popup.show({content: popup, title: 'Info'});
      return false;
    });
  });
};

TileMill.visualization = {
  settings: {},
  plugins: {},
};

TileMill.visualization.init = function(mml) {
  if (mml.metadata) {
    var keys = ['label', 'unique', 'choropleth', 'choroplethSplit', 'scaledPoints'];
    for (var key in mml.metadata) {
      if ($.inArray(key, keys)) {
        TileMill.visualization.settings[key] = mml.metadata[key];
      }
    }
  }
};

TileMill.visualization.attach = function(field, datatype, li) {
  $('a.visualization-type', li).each(function() {
    var type = $(this).attr('class').split('visualization-type inspect-')[1];

    // Only show choropleth and scaledPoints on int, float types.
    if ((type === 'choropleth' || type === 'scaledPoints') && (datatype !== 'int' && datatype !== 'float')) {
      $(this).remove();
    }

    // Set active classes.
    if (TileMill.visualization.settings[type] && TileMill.visualization.settings[type] === field) {
      $(this).addClass('active');
    }

    // Attach click handler.
    $(this).click(function() {
      if ($(this).is('.active')) {
        $(this).removeClass('active');
        delete TileMill.visualization.settings[type];
      }
      else {
        $('#inspector a.inspect-'+ type).removeClass('active');

        // Choropleth and unique value are mutually exclusive.
        if (type === 'choropleth' || type === 'unique') {
          $('#inspector a.inspect-choropleth, #inspector a.inspect-unique').removeClass('active');
        }

        $(this).addClass('active');
        TileMill.visualization.settings[type] = field;
      }
      TileMill.visualization.save();
      return false;
    });
  });
};

TileMill.visualization.save = function() {
  var queue = new TileMill.queue();

  // Save project MML including any changed metadata.
  queue.add(function(next) {
    var mml = TileMill.mml.parseMML(TileMill.settings.mml);
    var id = TileMill.settings.id;
    mml.metadata = TileMill.visualization.settings;
    TileMill.backend.post('visualization/' + id + '/' + id + '.mml', TileMill.mml.generate(mml), next);
  });
  // Store project MSS and pass to each visualization type.
  queue.add(function(next) {
    var self = this;
    var mss = {
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
    };
    self.store('mss', mss);
    next();
  });
  $.each(TileMill.visualization.settings, function(type, field) {
    if (TileMill.visualization.plugins[type]) {
      queue.add(function(next) {
        var self = this;
        var mss = self.retrieve('mss');
        TileMill.visualization.plugins[type](field, mss, function(data) {
          console.log(data);
          self.store('mss', data);
          next();
        });
      });
    }
  });
  queue.add(function(next) {
    var self = this;
    var mss = self.retrieve('mss');
    var id = TileMill.settings.id;
    TileMill.stylesheet.save('visualization/' + id + '/' + id + '.mss', TileMill.mss.generate(mss), next);
  });
  queue.add(function(next) {
    TileMill.inspector.load();
    TileMill.uniq = (new Date().getTime());
    TileMill.map.reload($('#map-preview'), TileMill.backend.servers(TileMill.mml.url()));
  });
  queue.execute();
  
  /*
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
  */
};

TileMill.visualization.plugins.label = function(field, mss, callback) {
  mss['#inspect ' + field] = {
    'text-face-name': '"DejaVu Sans Book"',
    'text-fill': '#333',
    'text-size': 9,
  };
  if (callback) {
    callback(mss);
  }
  else {
    return mss;
  }
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

TileMill.__save = function() {
  TileMill.stylesheet.save(TileMill.settings.project_id, TileMill.basic.stylesheet);
  TileMill.uniq = (new Date().getTime());
  TileMill.map.reload();
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
