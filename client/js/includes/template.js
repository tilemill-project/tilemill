// Simple JavaScript Templating
// John Resig - http://ejohn.org/ - MIT Licensed
TileMill.templates = {};
TileMill.template = function(template, data) {
  // Figure out if we're getting a template, or if we need to
  // load the template - and be sure to cache the result.
  var fn = TileMill.templates[template];
  if (!fn) {
    fn = TileMill.templates[template] = new Function("obj",
      "var p=[],print=function(){p.push.apply(p,arguments);};" +
      // Introduce the data as local variables using with(){}
      "with(obj){p.push('" +
      // Convert the template into pure JavaScript
      $('script[name=' + template + ']').html()
        .replace(/[\r\t\n]/g, " ")
        .split("<%").join("\t")
        .replace(/((^|%>)[^\t]*)'/g, "$1\r")
        .split("'").join("\\'")
        .replace(/\t=(.*?)%>/g, "',$1,'")
        .split("\t").join("');")
        .split("%>").join("p.push('")
        .split("\r").join("\\'")
    + "');}return p.join('');");
  }
  // Provide some basic currying to the user
  return data ? fn( data ) : fn;
};
