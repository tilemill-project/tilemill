TileMill.initCodeEditor = function(stylesheet, update) {
  if (stylesheet && stylesheet.data('tilemill')) {
    if (!$('#tabs .active').size() || update === true) {
      var data = $('input', stylesheet).val();
      if (!update) {
        $('#tabs a.active').removeClass('active');
        stylesheet.addClass('active');

        $('#code').val(data);
        TileMill.mirror = CodeMirror.fromTextArea('code', {
          height: "100%",
          parserfile: "parsecss.js",
          // @TODO: Refactor how this is done.
          stylesheet: "static/css/code.css",
          path: "static/js/codemirror/js/"
        });
        setInterval(function() {
          TileMill.colors.reload(TileMill.mirror.getCode());
        }, 5000);
        TileMill.colors.reload(data);
      }
      else {
        $('#tabs a.active input').val(TileMill.mirror.getCode());
        $('#tabs a.active').removeClass('active');
        stylesheet.addClass('active');

        TileMill.mirror.setCode(data);
        TileMill.colors.reload(data);
      }
    }
  }
};
