window.ListView = Backbone.View.extend({
    initialize: function () {
        this.render();
    },
    render: function () {
        var projectList = new ProjectListView({ collection: new ProjectList });
        $(this.el).html(ich.ListView());
        $('#content', this.el).append(projectList.el);
        window.app.el.html(this.el);
        return this;
    }
});
