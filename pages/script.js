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
            var heading = this;
            var cleaned = $(this).text().replace(/[\s\W]+/g, '-').toLowerCase();
            $(this).attr('id', cleaned);
            this.className = this.nodeName;

            if (!$(this).is('h1')) {
                $('.navigation ul').append(
                    $('<li></li>')
                        .addClass(heading.nodeName)
                        .append($('<a></a>')
                            .text($(heading).text())
                            .attr('href', '#')
                            .click(function() {
                                window.scroll(0, $(heading).offset().top - 60);
                                console.log($(heading).offset().top);
                                return false;
                            })
                    )
                );
            }
        });
    });
    $('a.video').click(function() {
        $('.banner').addClass('video');
        return false;
    });
    $('#video .close').click(function() {
        $('.banner').removeClass('video');
        return false;
    });
});

