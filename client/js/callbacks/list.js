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
      addQueue.add(function(name, type, next) {
        var filename = type + '/' + name;
        TileMill.backend.add(filename, function(data) {
          if (data.status) {
            next();
          }
          else {
            TileMill.popup.show({ title: 'Error', content: data.message });
          }
          $(self).removeClass('ajaxing');
        })
      }, [name, type]);
      if (type == 'visualization') {
        addQueue.add(function(name, next) {
          next();
        }, [name]);
        addQueue.add(function(name, next) {
          next();
        }, [name]);
      }
      else {
        addQueue.add(function(name, next) {
          next();
        }, [name]);
        addQueue.add(function(name, next) {
          next();
        }, [name]);
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
