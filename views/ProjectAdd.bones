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
    var attr = Bones.utils.form(this.$('form'), this.model);
    var error = function(m, e) { new views.Modal(e); };
    if (!this.model.set(attr, {error:error})) return false;

    $(this.el).addClass('loading');
    this.model.setDefaults(this.$('input[name=use-default]')[0].checked);
    this.model.save({}, {
        success: _(function(model) {
            Bones.utils.until(model.thumb(), _(function() {
                this.model.collection.add(this.model);
                $(this.el).removeClass('loading');
                window.location.hash = '#/project/' + this.model.get('id');
                this.$('a[href="#close"]').click();
            }).bind(this));
        }).bind(this),
        error:error
    });
    return false;
};

