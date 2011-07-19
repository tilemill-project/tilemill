view = Backbone.View.extend();

view.prototype.events = {
    'click .libraries a': 'library',
    'click a.location': 'libraryLocation',
    'click a.uri': 'libraryURI'
};

view.prototype.initialize = function(options) {
    if (!options.input) throw new Error('options.input required.')

    _(this).bindAll(
        'render',
        'library',
        'libraryLocation',
        'libraryURI'
    );
    this.input = options.input;
    this.render();
};

view.prototype.render = function() {
    var breadcrumb = [];
    if (this.model.get('location')) {
        breadcrumb = _(this.model.get('location').split('/')).chain()
            .compact()
            .reduce(function(memo, part) {
                if (!memo.length) {
                    memo.push(part);
                } else {
                    memo.push(_(memo).last() + '/' + part);
                }
                return memo;
            }, [])
            .value();
    }

    var render = $(templates.Library({
        breadcrumb:breadcrumb,
        model:this.model
    }));
    if (this.$('.assets').size()) {
        this.$('.assets').replaceWith($('.assets', render));
        this.$('.breadcrumb').replaceWith($('.breadcrumb', render));
    } else {
        $(this.el).html(render);
    }
    return this;
};

view.prototype.library = function(ev) {
    var id = $(ev.currentTarget).attr('href').split('#').pop();
    this.model.set({id:id, location:undefined});
    this.model.fetch({
        success:this.render,
        error:function(m, err) { new views.Modal(err) }
    });
};

view.prototype.libraryLocation = function(ev) {
    var location = $(ev.currentTarget).attr('href').split('#').pop();
    this.model.set({location:location});
    this.model.fetch({
        success:this.render,
        error:function(m, err) { new views.Modal(err) }
    });
    return false;
};

view.prototype.libraryURI = function(ev) {
    var uri = $(ev.currentTarget).attr('href').split('#').pop();
    this.input.val(uri);
    return false;
};

