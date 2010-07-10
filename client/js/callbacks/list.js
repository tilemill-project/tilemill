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
    $('input[type=submit]', page).bind('click', function() {
      if ($(this).is('.ajaxing')) {
        return;
      }
      $(this).addClass('ajaxing');
      var type = $(this).parents('form').attr('id'), name = $(this).parents('form').find('.text').val(), self = this, addQueue = new TileMill.queue();
      if (!name) {
        TileMill.popup.show({ title: 'Error', content: 'Name field is required.' });
        return false;
      }
      addQueue.add(function(name, type, next) {
        TileMill.backend.servers.python.add(name, type, function(data) {
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
      return false;
    });
    TileMill.show(page);
  });

  queue.execute();
}