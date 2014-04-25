view = Backbone.View.extend();

view.prototype.events = {
    'click .swatch': 'colorOpen',
    'click .swatch a[href=#save]': 'colorSave',
    'click .swatch a[href=#close]': 'colorClose',
    'click a.add': 'stylesheetAdd',
    'click a.icon': 'stylesheetDelete',
    'sortupdate .tabs': 'sortStylesheets',
    'click .status a[href=#close]': 'statusClose',
    'click #tabs-left': 'moveTabsLeft',
    'click #tabs-right': 'moveTabsRight'
};

view.prototype.initialize = function() {
    _(this).bindAll(
        'render',
        'attach',
        'save',
        'error',
        'makeStylesheet',
        'stylesheetAdd',
        'stylesheetDelete',
        'sortStylesheets',
        'statusClose',
        'colors',
        'colorOpen',
        'colorSave',
        'colorClose',
        'moveTabsLeft',
        'moveTabsRight',
        'enableLeftRightButtons',
        'resizeTabsBar'
    );
    this.model.bind('save', this.save);
    this.model.bind('saved', this.attach);
    this.model.bind('error', this.error);
    this.model.bind('poll', this.render);
    this.model.bind('poll', this.attach);
    $(window).resize(this.resizeTabsBar);
    this.render().attach();
};

view.prototype.render = function(init) {
    $(this.el).html(templates.Editor());
    this.model.get('Stylesheet').chain().each(this.makeStylesheet);
    this.$('.tabs').sortable({
        axis: 'x',
        containment: 'parent',
        tolerance: 'pointer'
    });
    this.resizeTabsBar();
    return this;
};

view.prototype.attach = function() {
    this.statusClose();
    this.colors();
    return this;
};

view.prototype.save = function() {
    this.model.get('Stylesheet').forEach(function(model) {
        if (model.errors) {
            model.errors = [];
            for (i = 0; i < (model.codemirror.getValue().match(/\n/g)||[]).length+1; i++) {
                model.codemirror.clearMarker(i);
            }
        }
    });
    this.$('.tabs a.error').removeClass('error');
};

// Test for a Carto error of the form
//
//     style.mss:2 Invalid value for background-color ...
//
// and highlight the line number and stylesheet appropriately if
// found. Otherwise, display error in a modal.
view.prototype.error = function(model, resp) {
    if (resp.responseText) {
        // this assume Carto.js specific error array format response
        var err_message = JSON.parse(resp.responseText).message;
        var err_group = _(err_message.toString().split('\n')).compact();
        var lines = [];
        for (var i = 0; i < err_group.length; i++) {
            var match = err_group[i].match(/^(Error: )?([\w.]+):([\d]+):([\d]+) (.*)$/);
            if (match) {
                var stylesheet = this.model.get('Stylesheet').get(match[2]),
                    id = 'stylesheet-' + stylesheet.id.replace(/[\.]/g, '-'),
                    lineNum = parseInt(match[3]) - 1;
                this.$('.tabs a[href=#' + id + ']').addClass('error');
                stylesheet.errors = stylesheet.errors || [];
                lines.push(lineNum+1);
                stylesheet.errors[lineNum] = match[5] + ' (line ' + (lineNum+1) + ')';
                stylesheet.codemirror.setMarker(lineNum, '%N%', 'error');
                if (err_group.length == 1) {
                    this.$('.status').addClass('active');
                    this.$('.status .content').text(stylesheet.errors[lineNum]);
                }
            } else {
                new views.Modal(err_group[i]);
                break;
            }
            if (lines.length > 1) {
                this.$('.status').addClass('active');
                this.$('.status .content').text("Click lines " + lines + " to see each error");
            }
        }
    } else {
        // will hit this if the server is offline and the user tries to save
        // We attach a error message to this resp object so that that the Modal can display it
        resp.err_message = 'Could not save project "' + model.id + '"';
        new views.Modal(resp);
    }
};

view.prototype.makeStylesheet = function(model) {
    if (!CodeMirror) throw new Error('CodeMirror not found.');
    var codeEl = this.$('.code').get(0),
        self = this,
        id = 'stylesheet-' + model.id.replace(/[\.]/g, '-');
    model.el = $(templates.ProjectStylesheet(model));
    model.codemirror = CodeMirror(codeEl, {
        value: model.get('data'),
        lineNumbers: true,
        tabMode: 'shift',
        mode: {
            name: 'carto',
            reference: window.abilities.carto,
            onColor: this.colors
        },
        onCursorActivity: function() {
            model.set({'data': model.codemirror.getValue()});
        },
        onChange: function() {
            // onchange runs before this function is finished,
            // so self.codemirror is false.
            model.codemirror && model.set({
                data: model.codemirror.getValue()
            });
            _.debounce(self.colors, 500);
        },
        onGutterClick: _(function(editor, line, ev) {
            if (model.errors && model.errors[line]) {
                this.$('.status').addClass('active');
                this.$('.status .content').text(model.errors[line]);
                return false;
            }
        }).bind(this)
    });

    var cartoCompleter = cartoCompletion(
        model.codemirror,
        window.abilities.carto);

    function updateSelectors(model) {
        var ids = _.map(model.get('Layer').pluck('id'),
            function(x) { return '#' + x; });
        var classes = _(model.get('Layer').pluck('class')).chain().map(
            function(c) {
                if (c == undefined) return '';
                var cs = c.split(' ');
                if (cs[0] == '') return '';
                return _.map(cs, function(x) { return '.' + x; });
            }).flatten().compact().value();
        cartoCompleter.ids(ids);
        cartoCompleter.classes(classes);
    }

    this.model.bind('change', updateSelectors);
    updateSelectors(this.model);

    model.codemirror.setOption('onKeyEvent',
        cartoCompleter.onKeyEvent);

    model.codemirror.setOption('onHighlightComplete',
        _.throttle(cartoCompleter.setTitles, 100));

    $(model.codemirror.getWrapperElement())
        .addClass(id)
        .addClass(model.collection.indexOf(model) === 0 ? 'active' : '');
    this.$('.tabs').append(model.el);

    // Bind to the 'remove' event to teardown.
    model.bind('remove', _(function(model) {
        model.el.remove();
        $(model.codemirror.getWrapperElement()).remove();
        this.$('.tabs a.tab:last').click();
    }).bind(this));
};

view.prototype.stylesheetAdd = function(ev) {
    var model = new models.Stylesheet({}, {
        collection: this.model.get('Stylesheet')
    });
    model.bind('add', this.makeStylesheet);
    new views.Stylesheet({el:$('#popup'), model:model});
};

view.prototype.stylesheetDelete = function(ev) {
    var id = $(ev.currentTarget).attr('href').split('#').pop();
    new views.Modal({
        content: 'Are you sure you want to delete stylesheet "' + id + '"?',
        callback: _(function() {
            var model = this.model.get('Stylesheet').get(id);
            this.model.get('Stylesheet').remove(model);
        }).bind(this),
        affirmative: 'Delete'
    });
};

view.prototype.sortStylesheets = function() {
    var order = _(this.$('.tabs li a.icon')).chain()
        .map(function(el) { return $(el).attr('href').split('#').pop(); })
        .uniq()
        .value();
    this.model.get('Stylesheet').models = this.model.get('Stylesheet')
        .sortBy(function(model) { return _(order).indexOf(model.id) });
    this.model.get('Stylesheet').trigger('change');
};

view.prototype.statusClose = function(ev) {
    this.$('.status').removeClass('active');
    return false;
};

view.prototype.css2rgb = function(c) {
    var x = function(i, size) {
        return Math.round(parseInt(c.substr(i, size), 16)
            / (Math.pow(16, size) - 1) * 255);
    };
    if (c[0] === '#' && c.length == 7) {
        return {R:x(1, 2), G:x(3, 2), B:x(5, 2)};
    } else if (c[0] === '#' && c.length == 4) {
        return {R:x(1, 1), G:x(2, 1), B:x(3, 1)};
    } else {
        var rgb = c.match(/\d+/g);
        return {R:rgb[0], G:rgb[1], B:rgb[2]};
    }
};

view.prototype.colorOpen = function(ev) {
    // Colorpicker uses canvas... disable in IE for now.
    if ($.browser.msie) return;

    if (this.$('#colorpicker').size()) return;

    var swatch = $(ev.currentTarget);
    $(this.el).addClass('overlay');
    this.$('.colors').addClass('active');
    var find = swatch.attr('title');
    var hsv = Color.RGB_HSV(this.css2rgb(find));
    var picker = $(templates.Colorpicker({find:find}));
    new Color.Picker({
        hue: hsv.H,
        sat: hsv.S,
        val: hsv.V,
        element: picker.get(0),
        callback: _(function(hex) {
            $('.color', swatch).css('backgroundColor', '#'+hex);
        }).bind(this)
    });
    swatch.append(picker);
};

view.prototype.colorSave = function(ev) {
    var swatch = $(ev.currentTarget).parents('.swatch');
    var from = $('input[name=find]', swatch).val();
    var to = $('.color', swatch).css('backgroundColor');
    if (from) {
        from = from.replace('(', '\\(').replace(')', '\\)');
        from = new RegExp(from, 'g');
        to = '#' + Color.HEX_STRING(Color.RGB_HEX(this.css2rgb(to)));
        this.model.get('Stylesheet').each(function(s) {
            var data = s.get('data').replace(from, to);
            s.set({ data: data });
            var lines = data.split("\n");
            s.codemirror.replaceRange(data, {line: 0, ch: 0}, {line: lines.length, ch: lines[lines.length - 1].length });
        });
        this.model.save();
    }
    $(this.el).removeClass('overlay');
    this.$('.colors').removeClass('active');
    this.$('#colorpicker').remove();
    return false;
};

view.prototype.colorClose = function(ev) {
    var swatch = $(ev.currentTarget).parents('.swatch');
    var from = $('input[name=find]', swatch).val();
    $('.color', swatch).css('backgroundColor', from);
    $(this.el).removeClass('overlay');
    this.$('.colors').removeClass('active');
    this.$('#colorpicker').remove();
    return false;
};

view.prototype.colorList = {};
view.prototype.colors = function(color) {
    if (color) {
        this.colorList[color] = true;
    }
    // Rescan stylesheets for colors, dedupe, sort by luminosity
    // and render swatches for each one.
    this.$('.colors').empty();
    _(this.model.get('Stylesheet').pluck('data').join('\n')
        .match(/\#[A-Fa-f0-9]{6}\b|\#[A-Fa-f0-9]{3}\b|\b(rgb\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)|rgba\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*(0?\.)?\d+\s*\))/g) || []
    ).chain()
        .uniq()
        .each(_(function(color) {
            if (color[0] != '#' || this.colorList[color]) {
                var swatch = templates.ProjectSwatch({ color: color});
                this.$('.colors').append(swatch);
            }
        }).bind(this));
}

view.prototype.moveTabsLeft = function() {
    if (this.$('.tabs:animated').size() > 0) return;

    var contentWidth = 0; 
    this.$('.tabs li').each(function(i, li) {
        contentWidth += $(li).width();
    });

    var width = this.$('.tabs-container').width();
    
    var currentMargin = parseInt(this.$('.tabs').css('margin-left'));

    if (-currentMargin < contentWidth - width - 1) {
        this.$('.tabs').animate({marginLeft: Math.max(currentMargin - 450, width - contentWidth)}, 500, this.enableLeftRightButtons);
    }
};

view.prototype.moveTabsRight = function() {
    if (this.$('.tabs:animated').size() > 0) return;

    var currentMargin = parseInt(this.$('.tabs').css('margin-left'));

    if (currentMargin < 0) {
        this.$('.tabs').animate({marginLeft: Math.min(0, currentMargin + 450)}, 500, this.enableLeftRightButtons);
    }
};

view.prototype.resizeTabsBar = function() {
    var fullWidth = this.$('.tabs-bar').width();
    fullWidth -= this.$('#tabs-right').width();
    fullWidth -= this.$('#tabs-left').width();
    fullWidth -= this.$('.tabs-bar .add').width();

    this.$('.tabs-container').width(fullWidth - 45);
    this.enableLeftRightButtons();
};

view.prototype.enableLeftRightButtons = function() {
    
    var contentWidth = 0; 
    this.$('.tabs li').each(function(i, li) {
        contentWidth += $(li).width();
    });

    var width = this.$('.tabs-container').width();
    var margin = parseInt(this.$('.tabs').css('margin-left'));

    if (margin === 0) {
        this.$('#tabs-right').addClass('disabled');
    } else {
        this.$('#tabs-right').removeClass('disabled');
    }

    if (width - contentWidth >= margin) {
        this.$('#tabs-left').addClass('disabled');
    } else {
        this.$('#tabs-left').removeClass('disabled');
    }
};

// Hook in to project view with an augment.
views.Project.augment({
    render: function(p) {
        p.call(this);
        return new views.Stylesheets({
            el:this.$('.editor'),
            model:this.model
        });
        return this;
    }
});
