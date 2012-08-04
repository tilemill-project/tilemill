(function() {
var mapbox = {};
mapbox.book = function() {
    $('.book .tag a').click(function() {
        var target = $(this).attr('href').split('#').pop();
        $('.book .expanded').removeClass('expanded');
        $('.book .' + target).addClass('expanded');
        $(this).addClass('expanded');
        return false;
    });
};
mapbox.mailChimp = function() {
    var fnames = 'EMAIL';
    var mce_validator = $('#mc-embedded-subscribe-form').validate(options);
    // remove the validator so we can get into
    // beforeSubmit on the ajaxform, which then calls the validator
    $('#mc-embedded-subscribe-form').unbind('submit');

    var options = {
        url: 'http://mapbox.us2.list-manage.com/subscribe/post-json?u=1b29ad842d113cece02035883&id=6cbe531fd0&c=?',
        type: 'GET',
        dataType: 'json',
        contentType: 'application/json; charset=utf-8',
        beforeSubmit: function() {
            $('#mce_tmp_error_msg').remove();
            $('#mc-signup').each(function (){
                var txt = 'filled';
                var fields = [];
                var i = 0;
                $(':text', this).each(function (){
                    fields[i] = this;
                    i++;
                });
            });
            return mce_validator.form();
        },
        success: mce_success_cb
    };
    $('#mc-embedded-subscribe-form').ajaxForm(options);

    function mce_success_cb(resp) {
        $('#mce-success-response').hide();
        $('#mce-error-response').hide();
        if (resp.result === 'success') {
            $('#mce-' + resp.result + '-response').show();
            $('#mce-' + resp.result + '-response').html(resp.msg);
            $('#mc-embedded-subscribe-form').each(function(){
                this.reset();
            });
        } else {
            var index = -1;
            var msg;
            try {
                var parts = resp.msg.split(' - ',2);
                if (parts[1] === undefined) {
                    msg = resp.msg;
                } else {
                    i = parseInt(parts[0], 10);
                    if (i.toString() === parts[0]) {
                        index = parts[0];
                        msg = parts[1];
                    } else {
                        index = -1;
                        msg = resp.msg;
                    }
                }
            } catch(e){
                index = -1;
                msg = resp.msg;
            }
            try {
                if (index === -1) {
                    $('#mce-' + resp.result + '-response').show();
                    $('#mce-' + resp.result + '-response').html(msg);
                } else {
                    err_id = 'mce_tmp_error_msg';
                    html = '<div id="' + err_id + '" style="' + err_style + '"> ' + msg + '</div>';

                    var input_id = '#mc-signup';
                    var f = $(input_id);

                    input_id = '#mce-' + fnames;
                    f = $().parent(input_id).get(0);

                    if (f){
                        $(f).append(html);
                        $(input_id).focus();
                    } else {
                        $('#mce-' + resp.result + '-response').show();
                        $('#mce-' + resp.result + '-response').html(msg);
                    }
                }
            } catch(e){
                $('#mce-' + resp.result + '-response').show();
                $('#mce-' + resp.result + '-response').html(msg);
            }
        }
    }
};
this.mapbox = mapbox;
})();
