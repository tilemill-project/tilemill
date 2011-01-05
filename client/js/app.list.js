window.ListView = Backbone.View.extend({
    events: {
        'click div#header a.info': 'appInfo',
    },
    initialize: function () {
        this.render();
    },
    render: function () {
        var projectList = new ProjectListView({ collection: new ProjectList });
        $(this.el).html(ich.ListView());
        $('#content', this.el).append(projectList.el);
        window.app.el.html(this.el);
        return this;
    },
    appInfo: function() {
        window.app.message('About TileLive', '@TODO: Put something facinating here.');
        return false;
    }
});
