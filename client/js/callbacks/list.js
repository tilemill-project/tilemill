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
    TileMill.backend.list('visualization', function(projects) {
      self.store('visualizations', projects);
      next();
    });
  });

  queue.add(function() {
    var projects = this.retrieve('projects'), visualizations = this.retrieve('visualizations');
    var page = $(TileMill.template('list', {
      projects: TileMill.template('column', { 'name': 'Projects', 'type': 'project', 'data': projects }),
      visualizations: TileMill.template('column', { 'name': 'Visualizations', 'type': 'visualization', 'data': visualizations }),
    }));
    $('input[type=submit]', page).bind('click', function() {
      if ($(this).is('.ajaxing')) {
        return false;
      }
      var type = $(this).parents('form').attr('id'),
          name = $(this).parents('form').find('.text').val(),
          self = this,
          addQueue = new TileMill.queue();
      if (!name) {
        TileMill.popup.show({ title: 'Error', content: 'Name field is required.' });
        return false;
      }

      $(this).addClass('ajaxing');
      if (type == 'visualization') {
        var url = name;
        var srs = '&srsWGS84;';
        name = url.split('/').pop().split('.')[0];

        addQueue.add(function(name, type, next) {
          var filename = type + '/' + name;
          TileMill.backend.add(filename, next);
        }, [name, type]);
        addQueue.add(function(name, type, next) {
          var mss = type + '/' + name + '/' + name + '.mss';
          var data = TileMill.template('visualization-mss');
          TileMill.backend.post(mss, data, next);
        }, [name, type]);
        addQueue.add(function(name, type, next) {
          var mss = type + '/' + name + '/' + name + '.mss';
          var mml = type + '/' + name + '/' + name + '.mml';
          var data = TileMill.template('visualization-mml', {stylesheet: TileMill.backend.url(mss), url: url, srs: srs});
          TileMill.backend.post(mml, data, next);
        }, [name, type]);
      }
      else {
        addQueue.add(function(name, type, next) {
          var filename = type + '/' + name;
          TileMill.backend.add(filename, next);
        }, [name, type]);
        addQueue.add(function(name, type, next) {
          var mss = type + '/' + name + '/' + name + '.mss';
          var data = TileMill.template('project-mss');
          TileMill.backend.post(mss, data, next);
        }, [name, type]);
        addQueue.add(function(name, type, next) {
          var mss = type + '/' + name + '/' + name + '.mss';
          var mml = type + '/' + name + '/' + name + '.mml';
          var data = TileMill.template('project-mml', {stylesheet: TileMill.backend.url(mss)});
          TileMill.backend.post(mml, data, next);
        }, [name, type]);
      }
      addQueue.add(function(name, type) {
        $.bbq.pushState({ 'action': type, 'id': name });
      }, [name, type]);
      addQueue.execute();
      return false;
    });
    TileMill.show(page);
  });

  queue.execute();
}
