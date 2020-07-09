view = Backbone.View.extend();

view.prototype.events = {
    'click input[type=submit]': 'save'
};

view.prototype.initialize = function(options) {
    _(this).bindAll('render', 'save');
    this.render();
};

view.prototype.render = function() {
    this.$('.content').html(templates.Stylesheet({}));

    // Autofocus first field.
    this.$('input[type=text]:first').focus();
    return this;
};

view.prototype.save = function() {
    var attr = Bones.utils.form(this.$('.form'), this.model);
    var options = { error: function(m, resp) {
            console.log('error saving project: ' + m.id);
            new views.Modal(resp);
        }
    };
    if (this.model.set(attr, options)) {
        this.model.collection.add(this.model);
        this.$('a[href="#close"]').click();
    }
    return false;
};
