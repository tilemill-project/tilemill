var Projects = Backbone.Collection.extend({
  url: '/api/projects',
  model: Project
});
