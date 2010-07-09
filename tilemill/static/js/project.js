TileMill.controller.project = function() {
  var id = $.bbq.getState("id");
  TileMill.show(TileMill.template('project', {id: id}));
};
