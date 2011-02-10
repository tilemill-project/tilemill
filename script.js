// Application bootstrap.
$(function() {
    // Convert any markdown sections to HTML.
    $('.md').each(function() {
        var html = $('<div></div>')
            .html((new Showdown.converter()).makeHtml($(this).html()))
            .attr('class', $(this).attr('class'))
            .attr('id', $(this).attr('id'));
        $(this).hide().after(html);
        $('h1, h2, h3, h4, h5, h6', html).each(function() {
            var cleaned = $(this).text().replace(/[\s\W]+/g, '-').toLowerCase();
            $(this).attr('id', cleaned);
        });
    });

    // Set facebox paths.
    $.facebox.settings.closeImage = 'facebox/src/closelabel.png'
    $.facebox.settings.loadingImage = 'facebox/src/loading.gif'

    $('.screenshots a').facebox();
});

