/**
 * Controllers can be added and registered as callbacks in the route method.
 */
var TileMill = Backbone.Controller.extend({
    routes: {
        '': 'list',
        'list': 'list',
        'project': 'project',
        'visualization': 'visualization',
        'reference': 'reference'
    },
    
    initialize: function() {
      this._projects = new Projects;
      this._reference = new ReferenceView;
    },

    list: function() {
      console.log('LIST routed');
      $('#list').show();
      this._projects.fetch();
      this._projects.map(function(p) {
        var pr = new ProjectRow({model: p});
        $('#projects-list').html(pr.render());
      });
    },
    
    reference: function() {
      this._reference.render();
    }
});

$(function() {
  var tm = new TileMill();
  Backbone.history.start()
});
