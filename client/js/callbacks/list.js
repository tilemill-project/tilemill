TileMill.controller.list = function() { 
  var queue = new TileMill.queue();

  queue.add(function(next) {
    var self = this;
    TileMill.backend.list('project', function(projects) {
      self.store('projects', projects);
      next();
    });
  });

  queue.add(function(next) {
    var self = this;
    TileMill.backend.list('visualization', function(visualizations) {
      self.store('visualizations', visualizations);
      next();
    });
  });

  queue.add(function() {
    var projects = this.retrieve('projects'), visualizations = this.retrieve('visualizations');
    var page = $(TileMill.template('list', {
      projects: TileMill.template('column', { 'name': 'Projects', 'type': 'project', 'data': projects }),
      visualizations: TileMill.template('column', { 'name': 'Visualizations', 'type': 'visualization', 'data': visualizations }),
    }));
    TileMill.show(page);

    // Thumbnails for projects & visualizations
    for (var i in projects) {
      var id = projects[i];
      TileMill.settings.filename = 'project/' + id + '/' + id + '.mml';
      TileMill.map.initOL($('#map-thumb-' + id, page), TileMill.backend.servers(TileMill.mml.url()), {});
    }
    for (var i in visualizations) {
      var id = visualizations[i];
      TileMill.settings.filename = 'visualization/' + id + '/' + id + '.mml';
      TileMill.map.initOL($('#map-thumb-' + id, page), TileMill.backend.servers(TileMill.mml.url()), {});
    }

    $('form').each(function() {
      $(this).validate({
        errorLabelContainer: '#' + $(this).attr('id') + ' .messages',
        submitHandler: function(form) {
          var type = $(form).attr('id'),
              name = $('input.text', form).val();
          TileMill[type].add(name);
          return false;
        },
      });
    });
  });

  queue.execute();
};
