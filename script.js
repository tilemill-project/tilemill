// Application bootstrap.
$(function() {
    $('.md').each(function() {
        var text = $(this).html();
        text = (new Showdown.converter()).makeHtml(text);
        $(this).html(text);
    });
});

