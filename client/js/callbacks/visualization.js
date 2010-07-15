/**
 * Router controller: Visualization page.
 */
TileMill.controller.visualization = function() {
  var id = $.bbq.getState("id");
  TileMill.backend.get('visualization/' + id + '/' + id + '.mml', function(mml) {
    // Bail if MML was not valid.
    if (typeof mml != 'string') {
      TileMill.errorPage(mml.data);
      return false;
    }

    // Store current project data.
    TileMill.data.mml = mml;
    TileMill.data.id = id;
    TileMill.data.type = 'visualization';
    TileMill.data.filename = 'visualization/' + id + '/' + id + '.mml';

    // Set the unique query string.
    TileMill.data.uniq = (new Date().getTime());

    // Parse MML.
    var parsed = TileMill.mml.parseMML(mml);

    TileMill.show(TileMill.template('visualization', {id: id}));

    var inspector = TileMill.inspector.init();
    var map = TileMill.map.init();

    $('.inspector-close', inspector).remove();
    $('#sidebar').append(inspector);
    $('#main').append(map);

    // Init elements which require DOM presence.
    TileMill.map.initOL(map, TileMill.backend.servers(TileMill.mml.url()), {navigation: 1, fullscreen: 1, zoom: 1, panzoombar: 1}, parsed.metadata.mapCenter);

    // Init the visualization state.
    TileMill.visualization.init(TileMill.mml.parseMML(mml));

    // Load, inspect queue
    var queue = new TileMill.queue();
    queue
      .add(function(next) { TileMill.inspector.load(next); })
      .add(function(next) { TileMill.inspector.inspect('data', true); })
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

    $('div#header a.projectify').click(function() {
      var popup = $(TileMill.template('popup-projectify', {}));
      TileMill.popup.show({content: popup, title: 'Make project'});
      $('form', popup).validate({
        errorLabelContainer: 'form .messages',
        submitHandler: function(form) {
          TileMill.visualization.projectify($('#project-name', form).val());
          return false;
        }
      });
      return false;
    });
  });
};

TileMill.visualization = { settings: {}, plugins: {} };

/**
 * Init the visualization state from parsed MML. Grabs MML metadata and sets
 * the visualization settings which are used to affect maps.
 */
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

/**
 * Attach handlers to an individual field.
 */
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
          delete TileMill.visualization.settings.choropleth;
          delete TileMill.visualization.settings.unique;
        }

        $(this).addClass('active');
        TileMill.visualization.settings[type] = field;
      }
      TileMill.visualization.save();
      return false;
    });
  });
};

/**
 * Save the visualization.
 */
TileMill.visualization.save = function(callback) {
  var queue = new TileMill.queue();

  // Save project MML including any changed metadata.
  queue.add(function(next) {
    var mml = TileMill.mml.parseMML(TileMill.data.mml);
    var id = TileMill.data.id;
    mml.metadata = TileMill.visualization.settings;
    mml.metadata.mapCenter = TileMill.map.getCenter($('#map-preview'));
    TileMill.data.mml = TileMill.mml.generate(mml);
    TileMill.backend.post('visualization/' + id + '/' + id + '.mml', TileMill.data.mml, next);
  });
  // Store project MSS and pass to each visualization type.
  queue.add(function(next) {
    var self = this;
    var mss = {
      'Map': {
        'map-bgcolor': '#fff'
      },
      '#world': {
        'polygon-fill': '#eee',
        'line-color': '#ccc',
        'line-width': '0.5'
      },
      '#data': {
        'polygon-fill': '#bcb',
        'line-color': '#333',
        'line-width': '0.5'
      }
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
          self.store('mss', data);
          next();
        });
      });
    }
  });
  queue.add(function(next) {
    var self = this;
    var mss = self.retrieve('mss');
    var id = TileMill.data.id;
    TileMill.stylesheet.save('visualization/' + id + '/' + id + '.mss', TileMill.mss.generate(mss), next);
  });
  queue.add(function(next) {
    TileMill.inspector.load();
    TileMill.data.uniq = (new Date().getTime());
    TileMill.map.reload($('#map-preview'), TileMill.backend.servers(TileMill.mml.url()));
  });
  if (callback) {
    queue.add(function(next) {
      callback();
    });
  }
  queue.execute();
};

/**
 * Create a new visualization.
 */
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
        'map-bgcolor': '#fff'
      },
      '#world': {
        'polygon-fill': '#eee',
        'line-color': '#ccc',
        'line-width': '0.5'
      },
      '#data': {
        'polygon-fill': '#bcb',
        'line-color': '#333',
        'line-width': '0.5'
      }
    });
    TileMill.backend.post(mss, data, next);
  }, [name]);
  queue.add(function(name, next) {
    $('body').append(TileMill.template('loading', {}));
    TileMill.backend.datasource(Base64.urlsafe_encode(url), function(info) {
      var mss = 'visualization/' + name + '/' + name + '.mss';
      var mml = 'visualization/' + name + '/' + name + '.mml';
      var data = TileMill.mml.generate({
        stylesheets: [TileMill.backend.url(mss)],
        layers:[
          {
            id: 'world',
            srs: '&srsWGS84;',
            file: 'http://cascadenik-sampledata.s3.amazonaws.com/world_borders.zip',
            type: 'shape'
          },
          {
            id: 'data',
            srs: info.srs ? info.srs : '&srsWGS84;',
            file: url,
            type: 'shape'
          }
        ]
      });
      TileMill.backend.post(mml, data, next);
    });
  }, [name]);
  queue.add(function(name) {
    $.bbq.pushState({ 'action': 'visualization', 'id': name });
  }, [name]);
  queue.execute();
};

/**
 * Convert the current visualization into a project.
 */
TileMill.visualization.projectify = function(name) {
  var queue = new TileMill.queue();
  queue.add(function(next) {
    TileMill.visualization.save(next);
  });
  queue.add(function(name, next) {
    var filename = 'project/' + name;
    TileMill.backend.add(filename, next);
  }, [name]);
  // Copy MSS from visualization to project.
  queue.add(function(name, next) {
    var visualization = 'visualization/' + TileMill.data.id + '/' + TileMill.data.id + '.mss';
    var project = 'project/' + name + '/' + name + '.mss';
    TileMill.backend.get(visualization, function(data) {
      TileMill.backend.post(project, data, next);
    });
  }, [name]);
  // Copy MML from visualization to project.
  queue.add(function(name, next) {
    var mml = 'project/' + name + '/' + name + '.mml';
    var mss = 'project/' + name + '/' + name + '.mss';

    // Rewrite current visualization MML 
    var parsed = TileMill.mml.parseMML(TileMill.data.mml);
    parsed.stylesheets = [TileMill.backend.url(mss)];
    var data = TileMill.mml.generate(parsed);

    TileMill.backend.post(mml, data, next);
  }, [name]);
  queue.add(function(name) {
    $.bbq.pushState({ 'action': 'project', 'id': name });
  }, [name]);
  queue.execute();
};

/**
 * Visualization plugin: label.
 */
TileMill.visualization.plugins.label = function(field, mss, callback) {
  mss['#data ' + field] = {
    'text-face-name': '"DejaVu Sans Book"',
    'text-fill': '#333',
    'text-size': 9
  };
  if (callback) {
    callback(mss);
  }
  else {
    return mss;
  }
};

/**
 * Visualization plugin: choropleth.
 */
TileMill.visualization.plugins.choropleth = function(field, mss, callback) {
  var pluginCallback = (function(data) {
    var range = Math.abs(data.max - data.min),
      split = (TileMill.visualization.settings.choroplethSplit && TileMill.visualization.settings.choroplethSplit != 'undefined' ? TileMill.visualization.settings.choroplethSplit : 5),
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
      },
      min = data.min ? data.min : 0;
    for (i = 0; i < split; i++) {
      var selector = '#data[' + field + '>=' + (min + (individual * i)) + ']';
      mss[selector] = { 'polygon-fill': colors[split][i] };
    }
    if (callback) {
      callback(mss);
    }
    else {
      return mss;
    }
  });
  TileMill.backend.values({
    'mmlb64': TileMill.mml.url(),
    'layer': 'data',
    'field': field,
    'start': 0,
    'limit': 500,
    'callback': pluginCallback
  });
};

/**
 * Visualization plugin: unique.
 */
TileMill.visualization.plugins.unique = function(field, mss, callback) {
  var pluginCallback = (function(data) {
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
        ],
        processed = [],
        colorValues = {};
    for (i = 0; i < data.values.length; i++) {
      var pass = false;
      for (j = 0; j < processed.length; j++) {
        if (processed[j] == data.values[i]) {
          pass = true;
          continue;
        }
      }
      if (!pass) {
        var key = colors[i % colors.length];
        if (colorValues[key]) {
          colorValues[key].push(data.values[i]);
        }
        else {
          colorValues[key] = [data.values[i]];
        }
        processed.push(data.values[i]);
      }
    }
    for (var color in colorValues) {
      var selectors = [];
      for (var value = 0; value < colorValues[color].length; value++) {
        selectors.push('#data[' + field + '="' + colorValues[color][value] + '"]');
      }
      mss[selectors.join(",\n")] = { 'polygon-fill': color };
    }
    if (callback) {
      callback(mss);
    }
    else {
      return mss;
    }
  });
  TileMill.backend.values({
    'mmlb64': TileMill.mml.url(),
    'layer': 'data',
    'field': field,
    'start': 0,
    'limit': 500,
    'callback': pluginCallback
  });
};

/**
 * Visualization plugin: scaled points.
 */
TileMill.visualization.plugins.scaledPoints = function(field, mss, callback) {
  var pluginCallback = (function(data) {
    var range = Math.abs(data.max - data.min),
        individual = range / 10,
        sizes = { 0: 2, 1: 4, 2: 6, 3: 9, 4: 13, 5: 18, 6: 25, 7: 34, 8: 45, 9: 60 },
        min = data.min ? data.min : 0;
    for (i = 0; i < 10; i++) {
      var selector = '#data[' + field + '>=' + (min + (individual * i)) + ']';
      mss[selector] = {
        'point-file': 'url(http://mapbox-icons.s3.amazonaws.com/tilemill/points/' + i  + '.png)',
        'point-width': sizes[i],
        'point-height': sizes[i]
      };
    }
    if (callback) {
      callback(mss);
    }
    else {
      return mss;
    }
  });
  TileMill.backend.values({
    'mmlb64': TileMill.mml.url(),
    'layer': 'data',
    'field': field,
    'start': 0,
    'limit': 500,
    'callback': pluginCallback
  });
};
