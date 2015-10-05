view = Backbone.View.extend();

view.prototype.events = {
//    'click input[type=submit]': 'save'
    'click #add-new-map': 'save'
};

view.prototype.initialize = function(options) {
    _(this).bindAll('render', 'save');
    this.render();
};

view.prototype.render = function() {
    this.$('.content').html(templates.ProjectAdd(this.model));
    this.$('input[type=text]:first').focus();
    return this;
};

view.prototype.save = function() {

    var newMap = {
        name: $('input[name="id"]').val(),
        description: $('input[name="description"]').val(),
        center: this.$('[name="map-center"]').val()
    };


    // todo: make sure name is not empty
    $(this.el).addClass('loading');

    var self = this;
    $.ajax({
        type: 'POST',
        url: '/api/v1/maps',
        data: JSON.stringify(newMap),
        dataType: 'json',
        contentType:'application/json; charset=utf-8',
        success: function(data){

            self.$('input.cancel[type="button"]').click();
            $(self.el).removeClass('loading');
            window.location.hash = '#/project/' + data.id;
        },
        error: function(jqxhr, status, s){

            $(self.el).removeClass('loading');
            var message = "ERROR";
            if(jqxhr.responseText){
                message += " :" + jqxhr.responseText;
            }
            alert(message);
            self.$('input.cancel[type="button"]').click();
        }
    });
};

view.prototype.saveOriginal = function() {

    // changed for clima: the "name" is not invisible; we manually set it's value to be equal
    // to the "filename" field (which now is shown an "name")
    var sluggedId = slugify($('input[name="id"]').val());

    $('input[name="id"]').val(sluggedId);
    $('input[name="name"]').val(sluggedId);

    var attr = Bones.utils.form(this.$('form'), this.model);
    var error = function(m, e) { new views.Modal(e); };
    if (!this.model.set(attr, {error:error})) return false;

    $(this.el).addClass('loading');
    this.model.setDefaults(this.$('input[name=use-default]')[0].checked);
    this.model.save({}, {
        success: _(function(model) {
            Bones.utils.until(model.thumb(), _(function() {
                this.model.collection.add(this.model);
                $(this.el).removeClass('loading');
                window.location.hash = '#/project/' + this.model.get('id');
                this.$('.close').click();
            }).bind(this));
        }).bind(this),
        error:error
    });

    function slugify(string, replacement) {

      var charMap = {
        // latin
        'À': 'A', 'Á': 'A', 'Â': 'A', 'Ã': 'A', 'Ä': 'A', 'Å': 'A', 'Æ': 'AE',
        'Ç': 'C', 'È': 'E', 'É': 'E', 'Ê': 'E', 'Ë': 'E', 'Ì': 'I', 'Í': 'I',
        'Î': 'I', 'Ï': 'I', 'Ð': 'D', 'Ñ': 'N', 'Ò': 'O', 'Ó': 'O', 'Ô': 'O',
        'Õ': 'O', 'Ö': 'O', 'Ő': 'O', 'Ø': 'O', 'Ù': 'U', 'Ú': 'U', 'Û': 'U',
        'Ü': 'U', 'Ű': 'U', 'Ý': 'Y', 'Þ': 'TH', 'ß': 'ss', 'à':'a', 'á':'a',
        'â': 'a', 'ã': 'a', 'ä': 'a', 'å': 'a', 'æ': 'ae', 'ç': 'c', 'è': 'e',
        'é': 'e', 'ê': 'e', 'ë': 'e', 'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i',
        'ð': 'd', 'ñ': 'n', 'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o',
        'ő': 'o', 'ø': 'o', 'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u', 'ű': 'u',
        'ý': 'y', 'þ': 'th', 'ÿ': 'y', 'ẞ': 'SS',
        // greek
        'α':'a', 'β':'b', 'γ':'g', 'δ':'d', 'ε':'e', 'ζ':'z', 'η':'h', 'θ':'8',
        'ι':'i', 'κ':'k', 'λ':'l', 'μ':'m', 'ν':'n', 'ξ':'3', 'ο':'o', 'π':'p',
        'ρ':'r', 'σ':'s', 'τ':'t', 'υ':'y', 'φ':'f', 'χ':'x', 'ψ':'ps', 'ω':'w',
        'ά':'a', 'έ':'e', 'ί':'i', 'ό':'o', 'ύ':'y', 'ή':'h', 'ώ':'w', 'ς':'s',
        'ϊ':'i', 'ΰ':'y', 'ϋ':'y', 'ΐ':'i',
        'Α':'A', 'Β':'B', 'Γ':'G', 'Δ':'D', 'Ε':'E', 'Ζ':'Z', 'Η':'H', 'Θ':'8',
        'Ι':'I', 'Κ':'K', 'Λ':'L', 'Μ':'M', 'Ν':'N', 'Ξ':'3', 'Ο':'O', 'Π':'P',
        'Ρ':'R', 'Σ':'S', 'Τ':'T', 'Υ':'Y', 'Φ':'F', 'Χ':'X', 'Ψ':'PS', 'Ω':'W',
        'Ά':'A', 'Έ':'E', 'Ί':'I', 'Ό':'O', 'Ύ':'Y', 'Ή':'H', 'Ώ':'W', 'Ϊ':'I',
        'Ϋ':'Y',
        //turkish
        'ş':'s', 'Ş':'S', 'ı':'i', 'İ':'I', 'ç':'c', 'Ç':'C', 'ü':'u', 'Ü':'U',
        'ö':'o', 'Ö':'O', 'ğ':'g', 'Ğ':'G',
        // russian
        'а':'a', 'б':'b', 'в':'v', 'г':'g', 'д':'d', 'е':'e', 'ё':'yo', 'ж':'zh',
        'з':'z', 'и':'i', 'й':'j', 'к':'k', 'л':'l', 'м':'m', 'н':'n', 'о':'o',
        'п':'p', 'р':'r', 'с':'s', 'т':'t', 'у':'u', 'ф':'f', 'х':'h', 'ц':'c',
        'ч':'ch', 'ш':'sh', 'щ':'sh', 'ъ':'u', 'ы':'y', 'ь':'', 'э':'e', 'ю':'yu',
        'я':'ya',
        'А':'A', 'Б':'B', 'В':'V', 'Г':'G', 'Д':'D', 'Е':'E', 'Ё':'Yo', 'Ж':'Zh',
        'З':'Z', 'И':'I', 'Й':'J', 'К':'K', 'Л':'L', 'М':'M', 'Н':'N', 'О':'O',
        'П':'P', 'Р':'R', 'С':'S', 'Т':'T', 'У':'U', 'Ф':'F', 'Х':'H', 'Ц':'C',
        'Ч':'Ch', 'Ш':'Sh', 'Щ':'Sh', 'Ъ':'U', 'Ы':'Y', 'Ь':'', 'Э':'E', 'Ю':'Yu',
        'Я':'Ya',
        // ukranian
        'Є':'Ye', 'І':'I', 'Ї':'Yi', 'Ґ':'G', 'є':'ye', 'і':'i', 'ї':'yi', 'ґ':'g',
        // czech
        'č':'c', 'ď':'d', 'ě':'e', 'ň': 'n', 'ř':'r', 'š':'s', 'ť':'t', 'ů':'u',
        'ž':'z', 'Č':'C', 'Ď':'D', 'Ě':'E', 'Ň': 'N', 'Ř':'R', 'Š':'S', 'Ť':'T',
        'Ů':'U', 'Ž':'Z',
        // polish
        'ą':'a', 'ć':'c', 'ę':'e', 'ł':'l', 'ń':'n', 'ó':'o', 'ś':'s', 'ź':'z',
        'ż':'z', 'Ą':'A', 'Ć':'C', 'Ę':'e', 'Ł':'L', 'Ń':'N', 'Ś':'S',
        'Ź':'Z', 'Ż':'Z',
        // latvian
        'ā':'a', 'č':'c', 'ē':'e', 'ģ':'g', 'ī':'i', 'ķ':'k', 'ļ':'l', 'ņ':'n',
        'š':'s', 'ū':'u', 'ž':'z', 'Ā':'A', 'Č':'C', 'Ē':'E', 'Ģ':'G', 'Ī':'i',
        'Ķ':'k', 'Ļ':'L', 'Ņ':'N', 'Š':'S', 'Ū':'u', 'Ž':'Z',
        // currency
        '€': 'euro', '₢': 'cruzeiro', '₣': 'french franc', '£': 'pound',
        '₤': 'lira', '₥': 'mill', '₦': 'naira', '₧': 'peseta', '₨': 'rupee',
        '₩': 'won', '₪': 'new shequel', '₫': 'dong', '₭': 'kip', '₮': 'tugrik',
        '₯': 'drachma', '₰': 'penny', '₱': 'peso', '₲': 'guarani', '₳': 'austral',
        '₴': 'hryvnia', '₵': 'cedi', '¢': 'cent', '¥': 'yen', '元': 'yuan',
        '円': 'yen', '﷼': 'rial', '₠': 'ecu', '¤': 'currency', '฿': 'baht',
        "$": 'dollar',
        // symbols
        '©':'(c)', 'œ': 'oe', 'Œ': 'OE', '∑': 'sum', '®': '(r)', '†': '+',
        '“': '"', '”': '"', '‘': "'", '’': "'", '∂': 'd', 'ƒ': 'f', '™': 'tm',
        '℠': 'sm', '…': '...', '˚': 'o', 'º': 'o', 'ª': 'a', '•': '*',
        '∆': 'delta', '∞': 'infinity', '♥': 'love', '&': 'and', '|': 'or',
        '<': 'less', '>': 'greater'
      };

      replacement = replacement || '-';
      var result = '';
      for (var i=0; i < string.length; i++) {
        var ch = string[i];
        if (charMap[ch]) {
          ch = charMap[ch];
        }
        ch = ch.replace(/[^\w\s$\*\_\+~\.\(\)\'\"\!\-:@]/g, ''); // allowed
        result += ch;
      }
      result = result.replace(/^\s+|\s+$/g, ''); // trim leading/trailing spaces
      result = result.replace(/[-\s]+/g, replacement); // convert spaces
      result.replace("#{replacement}$", ''); // remove trailing separator
      return result;
    }


    return false;
};

