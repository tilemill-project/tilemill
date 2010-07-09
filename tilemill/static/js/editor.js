TileMill.controller.edit = function() {
  TileMill.show(TileMill.template('list', {
    projects: TileMill.template('column', { name: 'Projects', data: ['asf', 'bar'] }),
    visualizations: TileMill.template('column', { name: 'Visualizations', data: ['baz', 'asdf'] }),
  }));
}