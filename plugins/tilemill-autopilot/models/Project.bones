model = models['Project'];

// @TODO it would be great to use templates.AutopilotCompile here...
model.prototype.STYLESHEET_DEFAULT = [{
    id: 'autopilot.mss',
    data: '\
/*\n\
autopilot 0.0.1\n\
[{"id":"Map","background-color":"#b8dee6"},{"id":"countries","polygon-fill":["#fff"]}]\n\
*/\n\
Map { background-color: #b8dee6; }\n\
#countries { ::polygon { polygon-fill: #fff; } }'
}];

model.prototype.STYLESHEET_DEFAULT_NODATA = [{
    id: 'style.mss',
    data: '\
/*\n\
autopilot 0.0.1\n\
[{"id":"Map","background-color":"#b8dee6"}]\n\
*/\n\
Map { background-color: #b8dee6; }'
}];
