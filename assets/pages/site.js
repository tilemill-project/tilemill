(function() {
var tilemill = {};

tilemill.book = function() {
    $('.book li.topic').each(function() {
        var item = this;
        $('h3', item).click(function() {
            $('.book li.topic').removeClass('active');
            $(item).addClass('active');
            return false;
        });
    });
};

this.tilemill = tilemill;

})();
