// LibraryListView
// ---------------
// Page view. Wrapper around library list views that allows switching between
// various library views through a sidebar menu.
var LibraryListView = Backbone.View.extend({
    id: 'LibraryListView',
    events: {
        'click .header a.settings': 'settings',
        'click a.add': 'add'
    },
    initialize: function () {
        _.bindAll(this, 'render', 'settings', 'add', 'loading', 'done');
        this.collection.bind('add', this.render);
        this.collection.bind('remove', this.render);
        this.render();

        // Show the specified active Library or fallback to projects.
        if (this.options.active && this.collection.get(this.options.active)) {
            this.collection.get(this.options.active).view.show();
        } else if (this.options.active === 'exports') {
            this.exports.show();
        } else {
            this.projects.show();
        }
    },
    render: function () {
        if (!this.$('ul.libraries').size()) {
            $(this.el).html(ich.LibraryListView());
            this.projects = new LibraryRowView({
                model: new Library({ name: 'Projects', type: 'projects' }),
                list: this,
                fixed: true
            });
            this.exports = new LibraryRowView({
                model: new Library({ name: 'Exports', type: 'exports' }),
                list: this,
                fixed: true
            });
            this.$('ul.fixed').append(this.projects.el);
            this.$('ul.fixed').append(this.exports.el);
        }

        // Add a row view for each Library.
        var that = this;
        var pointer = null;
        this.collection.each(function(Library) {
            if (!Library.view) {
                Library.view = new LibraryRowView({
                    model: Library,
                    list: that
                });
                if (!pointer) {
                    that.$('ul.libraries').prepend(Library.view.el);
                }
                else {
                    $(pointer).after(Library.view.el);
                }
            }
            pointer = Library.view.el;
        });
        return this;
    },
    settings: function() {
        new SettingsPopupView({ model: window.app.settings });
        return false;
    },
    add: function() {
        new LibraryPopupView({
            model: new Library(),
            collection: this.collection,
            add: true
        });
        return false;
    },
    loading: function(message) {
        if (this.loadingView) return;
        this.loadingView = new LoadingView({message: message});
        this.$('.main').append(this.loadingView.el);
    },
    done: function() {
        if (!this.loadingView) return;
        this.loadingView.remove();
        delete this.loadingView;
    }
});

// LibraryListPopupView
// --------------------
// Popup view for browsing libraries with the intention of adding an asset to
// the input form field specified by `options.target`.
var LibraryListPopupView = PopupView.extend({
    id: 'LibraryListPopupView',
    events: _.extend({
        'click a.asset': 'select',
    }, PopupView.prototype.events),
    initialize: function (options) {
        _.bindAll(this, 'select', 'loading', 'done');
        this.options.title = 'Libraries';
        this.options.className = 'big';
        PopupView.prototype.initialize.call(this, options);

        // Show the first Library.
        this.collection.at(0).view.show();
    },
    render: function () {
        PopupView.prototype.render.call(this);
        this.$('.popup-content').html(ich.LibraryListPopupView());

        // Add a row view for each Library.
        var that = this;
        this.collection.each(function(Library) {
            Library.view = new LibraryRowView({
                model: Library,
                list: that
            });
            that.$('ul.libraries').append(Library.view.el);
        });
        return this;
    },
    select: function(ev) {
        this.options.target.val($(ev.currentTarget).attr('href'));
        this.close();
        return false;
    },
    loading: function(message) {
        if (this.loadingView) return;
        this.loadingView = new LoadingView({message: message});
        this.$('.main').append(this.loadingView.el);
    },
    done: function() {
        if (!this.loadingView) return;
        this.loadingView.remove();
        delete this.loadingView;
    }
});

// LibraryRowView
// --------------
// An individual library menu item in LibraryListView or LibraryPopupView.
var LibraryRowView = Backbone.View.extend({
    tagName: 'li',
    events: {
        'click a.title': 'show',
        'click a.delete': 'del',
        'click a.edit': 'edit'
    },
    initialize: function () {
        _.bindAll(this, 'render', 'show', 'del', 'edit');
        this.model.bind('change', this.render);
        this.list = this.options.list;
        this.render();

    },
    render: function () {
        $(this.el).html(ich.LibraryRowView({
            name: this.model.get('name'),
            fixed: this.options.fixed,
            type: this.model.get('type')
        }));
        return this;
    },
    show: function() {
        var that = this,
            path,
            List,
            ListView;

        that.list.loading('Loading assets');
        that.list.$('ul.menu a.active').removeClass('active');
        that.$('a').addClass('active');

        if (this.model.get('type') === 'projects') {
            path = 'projects';
            List = new ProjectList();
            ListView = ProjectListView;
        } else if (this.model.get('type') === 'exports') {
            path = 'exports';
            List = new ExportList();
            ListView = ExportListView;
        } else {
            path = this.model.id;
            List = this.model.assets;
            ListView = AssetListView;
        }

        List.fetch({
            success: function(collection) {
                var view = new ListView({
                    model: that.model,
                    collection: collection
                });
                that.list.done();
                that.list.$('.main').html(view.el);
                window.app.controller.saveLocation('library/' + path);
            }
        });
        return false;
    },
    del: function() {
        if (confirm('Are you sure you want to delete this Library?')) {
            this.model.destroy();
            this.remove();
        }
        return false;
    },
    edit: function() {
        new LibraryPopupView({
            model: this.model,
            collection: this.list
        });
        return false;
    }
});

// LibraryPopupView
// ----------------
// Popup form for adding or editing a Library model.
var LibraryPopupView = PopupView.extend({
    events: _.extend({
        'change select#type': 'dependent',
        'submit form': 'submit'
    }, PopupView.prototype.events),
    initialize: function(options) {
        _.bindAll(this, 'dependent');
        var data = _.extend({
            type_local: (this.model.get('type') === 'local'),
            type_s3: (this.model.get('type') === 's3'),
        }, this.model.attributes);
        this.options.title = this.options.add ? 'Add Library' : 'Edit Library';
        this.options.content = ich.LibraryPopupView(data, true);
        PopupView.prototype.initialize.call(this, options);
    },
    render: function() {
        PopupView.prototype.render.call(this);
        this.dependent();
        return this;
    },
    dependent: function() {
        this.$('.dependent').each(function(index, element) {
            var target = $(element).attr('field');
            if ($('#' + target).val() === $(element).attr('target')) {
                $(element).show();
            } else {
                $(element).hide();
            }
        });
        return false;
    },
    submit: function() {
        var that = this;
        var data = {};
        this.$('input.text:visible, select:visible').each(function(index, element) {
            var key = $(element).attr('id');
            var value = $(element).val();
            data[key] = value;
        });
        var success = this.model.set(data, { 'error': that.showError });
        if (success) {
            this.model.save();
            this.options.add && this.collection.add(this.model);
            this.remove();
        }
        return false;
    }
});

