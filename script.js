// Application bootstrap.
$(function() {
    // Convert any markdown sections to HTML.
    $('.md').each(function() {
        var html = $('<div></div>')
            .html((new Showdown.converter()).makeHtml($(this).html()))
            .attr('class', $(this).attr('class'))
            .attr('id', $(this).attr('id'));
        $(this).hide().after(html);
    });

    // Set facebox paths.
    $.facebox.settings.closeImage = 'facebox/src/closelabel.png'
    $.facebox.settings.loadingImage = 'facebox/src/loading.gif'

    $('.screenshots a').facebox();
});

