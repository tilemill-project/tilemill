var Project = Backbone.Model.extend({
  url: '/api/project',
  
  initialize: function() {
      this.stylesheets = new Stylesheets;
      this.stylesheets.url = '/project/' + this.id + '/mss';
  }
});