(function() {
var tilemill = {};

tilemill.book = function() {
    $('.book li.topic > h3').click(function() {
        console.log('foo');
        $(this).parent().toggleClass('active');
    });

};

this.tilemill = tilemill;

})();
