// Application bootstrap.
$(function() {
    // Convert any markdown sections to HTML.
    $('.md').each(function() {
        var text = $(this).html();
        text = (new Showdown.converter()).makeHtml(text);
        $(this).html(text);
    });

    // Set facebox paths.
    $.facebox.settings.closeImage = 'facebox/src/closelabel.png'
    $.facebox.settings.loadingImage = 'facebox/src/loading.gif'

    $('.screenshots a').facebox();
});

