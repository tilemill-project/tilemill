TileMill.controller.list = function() {
  TileMill.backend.list('projects', function(projects) {
    TileMill.backend.list('visualizations', function(visualizations) {
      var page = $(TileMill.template('list', {
        projects: TileMill.template('column', { 'name': 'Projects', 'data': projects }),
        visualizations: TileMill.template('column', { 'name': 'Visualizations', 'data': visualizations }),
      }));
      $('input[type=submit]', page).bind('click', function() {
        
      })
      TileMill.show(page);
    });
  });
}