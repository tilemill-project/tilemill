(function() {
var tilemill = {};

tilemill.book = function() {
    $('.book div.topic').each(function() {
        var item = this;
        $('h3', item).click(function() {
            $('.book div.topic').removeClass('active');
            $(item).addClass('active');
            return false;
        });
    });
};

this.tilemill = tilemill;

})();
