// ProviderListView
// ----------------
var ProviderListView = Backbone.View.extend({
    id: 'ProviderListView',
    events: {
        'click .header a.settings': 'settings',
        'click a.add': 'add'
    },
    initialize: function () {
        _.bindAll(this, 'render', 'settings', 'add', 'loading', 'done');
        this.collection.bind('add', this.render);
        this.collection.bind('remove', this.render);
        this.render();

        // Show the specified active provider or fallback to projects.
        if (this.options.provider && this.collection.get(this.options.provider)) {
            this.collection.get(this.options.provider).view.show();
        } else {
            this.projects.show();
        }
    },
    render: function () {
        if (!this.$('ul.providers').size()) {
            $(this.el).html(ich.ProviderListView());
            this.projects = new ProviderRowView({
                model: new Provider({ name: 'Projects', type: 'projects' }),
                list: this,
                fixed: true
            });
            this.$('ul.fixed').append(this.projects.el);
        }

        // Add a row view for each provider.
        var that = this;
        var pointer = null;
        this.collection.each(function(provider) {
            if (!provider.view) {
                provider.view = new ProviderRowView({
                    model: provider,
                    list: that
                });
                if (!pointer) {
                    that.$('ul.providers').prepend(provider.view.el);
                }
                else {
                    $(pointer).after(provider.view.el);
                }
            }
            pointer = provider.view.el;
        });
        return this;
    },
    settings: function() {
        new SettingsPopupView({ model: window.app.settings });
        return false;
    },
    add: function() {
        new ProviderPopupView({
            model: new Provider(),
            collection: this.collection,
            add: true
        });
        return false;
    },
    loading: function(message) {
        this.loadingView = new LoadingView({message: message});
        this.$('.main').append(this.loadingView.el);
    },
    done: function() {
        this.loadingView.remove();
    }
});

var ProviderListPopupView = PopupView.extend({
    id: 'ProviderListPopupView',
    events: _.extend({
        'click a.asset': 'select',
    }, PopupView.prototype.events),
    initialize: function (options) {
        _.bindAll(this, 'select', 'loading', 'done');
        this.options.title = 'Providers';
        this.options.size = 'big';
        PopupView.prototype.initialize.call(this, options);

        // Show the first provider.
        this.collection.at(0).view.show();
    },
    render: function () {
        PopupView.prototype.render.call(this);
        this.$('.popup-content').html(ich.ProviderListPopupView());

        // Add a row view for each provider.
        var that = this;
        this.collection.each(function(provider) {
            provider.view = new ProviderRowView({
                model: provider,
                list: that
            });
            that.$('ul.providers').append(provider.view.el);
        });
        return this;
    },
    select: function(ev) {
        this.options.target.val($(ev.currentTarget).attr('href'));
        this.close();
        return false;
    },
    loading: function(message) {
        this.loadingView = new LoadingView({message: message});
        this.$('.main').append(this.loadingView.el);
    },
    done: function() {
        this.loadingView.remove();
    }
});

var ProviderRowView = Backbone.View.extend({
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
        $(this.el).html(ich.ProviderRowView({
            name: this.model.get('name'),
            fixed: this.options.fixed,
            type: this.model.get('type')
        }));
        return this;
    },
    show: function() {
        var that = this;
        that.list.loading('Loading assets');
        that.list.$('ul.menu a.active').removeClass('active');
        that.$('a').addClass('active');
        if (this.model.get('type') === 'projects') {
            new ProjectList().fetch({
                success: function(collection) {
                    var view = new ProjectListView({ collection: collection });
                    that.list.done();
                    that.list.$('.main').html(view.el);
                }
            });
        } else {
            new AssetList({ provider: this.model }).fetch({
                success: function(collection) {
                    var view = new AssetListView({ collection: collection });
                    that.list.done();
                    that.list.$('.main').html(view.el);
                }
            });
        }
        return false;
    },
    del: function() {
        if (confirm('Are you sure you want to delete this provider?')) {
            this.model.destroy();
            this.remove();
        }
        return false;
    },
    edit: function() {
        new ProviderPopupView({
            model: this.model,
            collection: this.list
        });
        return false;
    }
});

var ProviderPopupView = PopupView.extend({
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
        this.options.title = this.options.add ? 'Add provider' : 'Edit provider';
        this.options.content = ich.ProviderPopupView(data, true);
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
        var data = {};
        this.$('input.text:visible, select:visible').each(function(index, element) {
            var key = $(element).attr('id');
            var value = $(element).val();
            data[key] = value;
        });
        var success = this.model.set(data, { 'error': this.showError });
        if (success) {
            this.model.save();
            this.options.add && this.collection.add(this.model);
            this.remove();
        }
        return false;
    }
});

