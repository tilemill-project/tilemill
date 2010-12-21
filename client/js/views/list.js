var ListView = Backbone.View.extend({
  
  tagName: "ul",
  
  render: function() {
    console.log(this.projects);
    $(this.el).html(ich.project_row({}));
  },
  
  initialize: function() {
    this.projects = new Projects();
    this.projects.bind('add', this.addOne);
    this.projects.bind('all', this.render);
    this.projects.fetch();
  },
  
  addOne: function() {
    console.log('called');
  }
  /*
    console.log('list');
  var queue = new TileMill.queue();

  queue.add(function(next) {
    var self = this;
    TileMill.backend.list('project', function(projects) {
      if (typeof projects == 'string') {
        alert(projects);
        return;
      }
      projects = projects || [];
      projects.sort();
      self.store('projects', projects);
      next();
    });
  });

  queue.add(function(next) {
    var self = this;
    TileMill.backend.list('visualization', function(visualizations) {
      visualizations = visualizations || [];
      visualizations.sort();
      self.store('visualizations', visualizations);
      next();
    });
  });

  queue.add(function() {
    var projects = this.retrieve('projects'),
        visualizations = this.retrieve('visualizations');
    var page = $(ich.list({
      projects: {
        name: 'Projects',
        type: 'project',
        data: projects
      },
      visualizations: {
        name: 'Visualizations',
        type: 'visualization',
        data: visualizations
      }
    }));
    TileMill.show(page);

    // Attach delete link handlers.
    $.each(['project', 'visualization'], function(dummy, type) {
      $('#' + type + ' a.file-delete').click(function() {
        if (confirm('Are you sure you want to delete this project?')) {
          $('body').append(ich.loading({}));
          var filename = $(this).attr('href').split('#delete=')[1];
          TileMill.backend.del(filename, function() {
            $.bbq.pushState({ 'action': 'list' });
            $(window).trigger('hashchange');
          });
        }
        return false;
      });
    });

    $('div#header a.info').click(function() {
      // TODO: rewrite fp
      var settings = [];
      for (var key in TileMill.settings) {
        if (typeof TileMill.settings[key] === 'string') {
          settings.push({ key: key, val: TileMill.settings[key] });
        }
      }
      var popup = ich.popup_info_settings({
          settings: settings
      });
      TileMill.popup.show({
          content: popup,
          title: 'Info'
      });
      return false;
    });

    $.validator.addMethod("alphanum", function(value, element) {
        return this.optional(element) || /^[a-z0-9\-_]+$/i.test(value);
    }, "Name must contain only letters, numbers, dashes, and underscores.");

    $('form').each(function() {
      $(this).validate({
        errorLabelContainer: '#' + $(this).attr('id') + ' .messages',
        submitHandler: function(form) {
          var type = $(form).attr('id'),
              name = $('input.text', form).val();
          TileMill[type].add(name);
          return false;
        }
      });
    });
  });

  queue.execute();
  */
});
