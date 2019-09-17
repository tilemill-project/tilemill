view = Backbone.View.extend();

view.prototype.events = {
    'click a[href=#back]': 'back',
    'click a.showall': 'showAll',
    'keyup input.search' : 'searchFeatures'
};

view.prototype.featureLimit = 100;

view.prototype.initialize = function(options) {
    this.render();
};

view.prototype.back = function() {
    $('.palette a[href=#layers]').click();
    return false;
};

view.prototype.render = function() {
    var features = this.model.get('features');
    var fields = _(this.model.get('fields')).reduce(function(memo, v, k) {
        if (_(memo).keys().length < 50) memo[k] = v;
        return memo;
    }, {});

    this.$('.content').html(templates.Datasource({
        fields: fields,
        features: _(features).first(this.featureLimit),
        more: _(features).size() > this.featureLimit,
        moreFields: _(_(this.model.get('fields')).keys()).difference(_(fields).keys())
    }));

    this.sort = new Tablesort(document.getElementById('features'));

    return this;
};

view.prototype.showAll = function() {
    this.$('a.showall').hide();
    this.$("input.search").val('');
    this.$('.content table tbody').append(templates.DatasourceRows({
        fields: this.model.get('fields'),
        features: _(this.model.get('features')).rest(this.featureLimit)
    }));
    this.sort.refresh();
    return false;
}

// Filter the list of Features by looking for matching characters in each row
view.prototype.searchFeatures = function(ev) {
    // Get character(s) entered for the search
    var val = this.$("input.search").val() || "";
    val = val.toLowerCase();

    // Look through each row
    this.$("table tr").each(function(index) {
        if (!index) return;
        $(this).find("td").each(function () {
            var id = $(this).text().toLowerCase().trim();
            var not_found = (id.indexOf(val) == -1);
            $(this).closest('tr').toggle(!not_found);
            return not_found;
        });
    });
};
