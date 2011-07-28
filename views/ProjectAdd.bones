view = Backbone.View.extend();

view.prototype.events = {
    'click input[type=submit]': 'save'
};

view.prototype.initialize = function(options) {
    _(this).bindAll('render', 'save');
    this.render();
};

view.prototype.render = function() {
    this.$('.content').html(templates.ProjectAdd(this.model));
    this.$('input[type=text]:first').focus();
    return this;
};

view.prototype.save = function() {
    var attr = _({
        'id':          this.$('input[name=id]').val(),
        'name':        this.$('input[name=name]').val(),
        'description': this.$('input[name=description]').val(),
        'format':      this.$('select[name=format]').val(),
    }).reduce(function(memo, val, key) {
        if (key === 'id' || val !== '') memo[key] = val;
        return memo;
    }, {});

    var error = function(m, e) { new views.Modal(e); };
    if (!this.model.set(attr, {error:error})) return false;

    $(this.el).addClass('loading');
    this.model.setDefaults();
    this.model.save({}, {
        success: _(function(model) {
            this.model.collection.add(this.model);
            $(this.el).removeClass('loading');
            this.$('.close').click();
        }).bind(this),
        error:error
    });
    return false;
};

