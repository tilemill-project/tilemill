/**
 * Model: Stylesheet
 *
 * This model is *not* backed directly by the server.
 * It is a child model of Project and is saved serialized as part of the parent
 * Project model.
 */
var Stylesheet = Backbone.Model.extend({
    initialize: function() {
        if (!this.get('data')) {
            this.set({'data': ''});
        }
    },
    validate: function(attributes) {
        if (/^[a-z0-9\-_.]+$/i.test(attributes.id) === false) {
            return 'Name must contain only letters, numbers, dashes, underscores and periods.';
        }
    }
});

/**
 * Collection: StylesheetList
 *
 * This collection is *not* backed directly by the server.
 * This collection is a child of the Project model. When it is updated
 * (add/remove events) it updates the attributes of its parent model as well.
 */
var StylesheetList = Backbone.Collection.extend({
    model: Stylesheet,
    initialize: function(models, options) {
        var self = this;
        this.parent = options.parent;
        this.bind('change', function() {
            this.parent.set({ 'Stylesheet': self });
            this.parent.change();
        });
        this.bind('add', function() {
            this.parent.set({ 'Stylesheet': self });
            this.parent.change();
        });
        this.bind('remove', function() {
            this.parent.set({ 'Stylesheet': self });
            this.parent.change();
        });
    }
});

/**
 * View: StylesheetListView
 *
 * Display a StylesheetList collection as a set of tabs.
 */
var StylesheetListView = Backbone.View.extend({
    initialize: function(options) {
        _.bindAll(this, 'render', 'add', 'activate');
        var self = this;
        this.collection.bind('add', this.render);
        this.collection.bind('add', this.activate);
        this.collection.bind('remove', this.render);
        this.collection.bind('remove', this.activate);
        window.app.bind('ready', this.activate);
        options.project.view.stylesheets = this;
        this.render();
        /*
        @TODO: bind re-render to project events.
        */
    },
    render: function() {
        // Render the stylesheets wrapper if not present.
        if ($(this.el).has('.stylesheets').length === 0) {
            $(this.el).html(ich.StylesheetListView());
            $('.stylesheets', this.el).sortable({
                axis: 'x',
                revert: true,
                containment: 'parent'
                // @TODO: proper event.
                // change: TileMill.project.changed
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
        return this;
    },
    activate: function() {
        if (this.activeTab) {
            this.activeTab.activate();
        }
    },
    events: {
        'click .add': 'add'
    },
    add: function() {
        new StylesheetPopupView({collection: this.collection});
        return false;
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
        this.tools = $(ich.StylesheetTools());
        this.codemirror = false;
        this.render();
    },
    render: function() {
        $(this.el).html(ich.StylesheetTabView({ id: this.model.get('id') }));
        $('#editor', this.list.el).append(this.input);

        return this;
    },
    events: {
        'click .name': 'activate',
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
                stylesheet: 'css/code.css',
                path: 'js/codemirror/js/',
                parserfile: 'parsemss.js',
                parserConfig: window.data.reference,
                saveFunction: function() {
                    self.model.collection.parent.view.saveProject();
                },
                onCursorActivity: function() {
                    self.model.set({'data': self.codemirror.getCode()});
                },
                onChange: function() {
                    // Trigger event on the project
                    self.model.collection.parent.trigger('codeMirrorChange');
                },
                initCallback: function(cm) {
                    self.model.collection.parent.trigger('ready');
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
        return this;
    }
});

/**
 * View: StylesheetPopupView
 *
 * Popup form for adding a new stylesheet.
 */
var StylesheetPopupView = PopupView.extend({
    events: _.extend(PopupView.prototype.events, {
        'click input.submit': 'submit'
    }),
    initialize: function(params) {
        this.options.title = 'Add stylesheet';
        this.options.content = ich.StylesheetPopupView({}, true);
        this.render();
    },
    showError: function(model, error) {
        window.app.message('Error', error);
    },
    submit: function() {
        var id = $('input.text', this.el).val();
        var stylesheet = new Stylesheet;
        var success = stylesheet.set(
            { id: id },
            { error: this.showError }
        );
        if (success) {
            this.collection.add(stylesheet);
            this.remove();
        }
        return false;
    }
});

