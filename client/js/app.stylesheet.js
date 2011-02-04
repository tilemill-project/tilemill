/**
 * View: StylesheetListView
 *
 * Display a StylesheetList collection as a set of tabs.
 */
var StylesheetListView = Backbone.View.extend({
    initialize: function(options) {
        _.bindAll(this, 'render', 'add', 'activate', 'sortUpdate', 'showError');
        var self = this;
        this.collection.bind('add', this.render);
        this.collection.bind('add', this.activate);
        this.collection.bind('remove', this.render);
        this.collection.bind('remove', this.activate);
        window.app.bind('ready', this.activate);
        options.project.view.stylesheets = this;
        this.render();
    },
    render: function() {
        // Render the stylesheets wrapper if not present.
        if ($(this.el).has('.stylesheets').length === 0) {
            $(this.el).html(ich.StylesheetListView());
            $('.stylesheets', this.el).sortable({
                axis: 'x',
                containment: 'parent'
            });
        }

        // Add a tab view for each stylesheet.
        var self = this;
        this.collection.each(function(stylesheet) {
            if (!stylesheet.view) {
                stylesheet.view = new StylesheetTabView({
                    model: stylesheet,
                    list: self
                });
                $('.stylesheets', self.el).append(stylesheet.view.el);
                self.activeTab = self.activeTab || stylesheet.view;
            }
        });

        // Refresh sortable to recognize new stylesheets.
        $('.stylesheets', this.el).sortable('refresh');
        return this;
    },
    activate: function() {
        if (this.activeTab) {
            this.activeTab.activate();
        }
    },
    events: {
        'click .add': 'add',
        'sortupdate .stylesheets': 'sortUpdate'
    },
    add: function() {
        new StylesheetPopupView({
            collection: this.collection
        });
        return false;
    },
    sortUpdate: function(e, ui) {
        var rows = this.$('.stylesheets .tab');
        var newCollection = [];
        this.collection.each(function(model) {
            var index = $.inArray(model.view.el, rows);
            newCollection[index] = model;
        });
        this.collection.models = newCollection; //.reverse();
        this.collection.trigger('change');
    },
    showError: function(err, data) {
        var that = this;
        var err_obj = $.parseJSON(data.responseText);
        if (_.isArray(err_obj)) {
            _.each(err_obj, function(error) {
                if (error.line) {
                    var editor = _.detect(
                        that.collection.models,
                        function(s) { return s.id == error.filename; }
                    );
                    if (editor) {
                        $('div.CodeMirror-line-numbers div:nth-child('
                            + error.line
                            + ')',
                            editor.view.codemirror.lineNumbers)
                            .addClass('syntax-error')
                            .attr('title', error.message)
                            .tipsy({gravity: 'w'});
                        $(editor.view.el).addClass('hasError');
                    }
                } else {
                    window.app.message('Error', error.message);
                }
            });
        } else {
            window.app.message('Error', err_obj.message);
        }
    },
    clearError: function() {
        // Clear out validation error markers. They will be re-drawn if this
        // save event encounters further errors.
        this.$('div.CodeMirror-line-numbers div')
            .removeClass('syntax-error')
            .attr('title', '')
            .unbind('mouseenter mouseleave'); // Removes tipsy.
        this.$('a.tab.hasError').removeClass('hasError');
    }
});

/**
 * View: StylesheetTabView
 *
 * Display a Stylesheet as a tab within a StylesheetListView.
 */
var StylesheetTabView = Backbone.View.extend({
    tagName: 'a',
    className: 'tab',
    initialize: function(params) {
        _.bindAll(this, 'render', 'update', 'del', 'activate', 'remove');
        this.list = params.list;
        this.input = $(ich.StylesheetTabEditor());
        this.codemirror = false;
        this.render();
    },
    render: function() {
        $(this.el).html(ich.StylesheetTabView({ id: this.model.get('id') }));
        $('#editor', this.list.el).append(this.input);

        return this;
    },
    events: {
        'mousedown': 'activate',
        'click .delete': 'del'
    },
    activate: function() {
        var self = this;

        $('#tabs .tab, #editor .editor', this.list.el).removeClass('active');
        $(this.el).addClass('active');
        $(this.input).addClass('active');
        $(this.tools).addClass('active');
        this.list.activeTab = this;
        if (!this.codemirror) {
            this.codemirror = CodeMirror.fromTextArea($('textarea', this.input).get(0), {
                content: this.model.get('data'),
                height: '100%',
                lineNumbers: true,
                stylesheet: 'css/code.css',
                path: 'CodeMirror/js/',
                parserfile: '../../js/app.parsemss.js',
                parserConfig: window.app.reference.toJSON(),
                saveFunction: function() {
                    self.model.collection.parent.view.saveProject();
                },
                onCursorActivity: function() {
                    self.model.set({'data': self.codemirror.getCode()});
                },
                onChange: function() {
                    // Trigger event on the project
                    self.model.collection.parent.trigger('codeMirrorChange');
                    self.model.set({'data': self.codemirror.getCode()});
                },
                initCallback: function(cm) {
                    self.model.collection.parent.trigger('ready');
                    $(cm.frame).attr('name', 'codemirror');
                }
            });
        }
    },
    del: function() {
        window.app.loading();
        if (confirm('Are you sure you want to delete this stylesheet?')) {
            this.list.collection.remove(this.model);
            this.remove();
            window.app.done();
        }
        else {
            window.app.done();
        }
        return false;
    },
    /**
     * Override of .remove(). Removes the input editor element as well.
     */
    remove: function() {
        $(this.el).remove();
        $(this.input).remove();

        // Get the first tab and activate it.
        var first = this.list.collection.at(0);
        first && first.view.activate();
        return this;
    }
});

/**
 * View: StylesheetPopupView
 *
 * Popup form for adding a new stylesheet.
 */
var StylesheetPopupView = PopupView.extend({
    events: _.extend({
        'click input.submit': 'submit'
    }, PopupView.prototype.events),
    initialize: function(params) {
        this.options.title = 'Add stylesheet';
        this.options.content = ich.StylesheetPopupView({}, true);
        this.render();
    },
    submit: function() {
        var that = this;
        var id = $('input.text', this.el).val();
        if (this.collection.get(id)) {
            window.app.message('Error', 'Stylesheet names must be unique.');
            return false;
        }
        var stylesheet = new Stylesheet;
        var success = stylesheet.set(
            { id: id },
            { error: that.showError }
        );
        if (success) {
            this.collection.add(stylesheet);
            this.remove();
        }
        return false;
    }
});

