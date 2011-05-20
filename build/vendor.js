/*
ICanHaz.js version 0.7 -- by @HenrikJoreteg
More info at: http://github.com/HenrikJoreteg/ICanHaz.js
*/
(function(c){
/*
  mustache.js -- Logic-less templates in JavaScript

  by @janl (MIT Licensed, https://github.com/janl/mustache.js/blob/master/LICENSE).

  See http://mustache.github.com/ for more info.
*/
var b=function(){var d=function(){};d.prototype={otag:"{{",ctag:"}}",pragmas:{},buffer:[],pragmas_implemented:{"IMPLICIT-ITERATOR":true},context:{},render:function(h,g,f,i){if(!i){this.context=g;this.buffer=[]}if(!this.includes("",h)){if(i){return h}else{this.send(h);return}}h=this.render_pragmas(h);var e=this.render_section(h,g,f);if(i){return this.render_tags(e,g,f,i)}this.render_tags(e,g,f,i)},send:function(e){if(e!=""){this.buffer.push(e)}},render_pragmas:function(e){if(!this.includes("%",e)){return e}var g=this;var f=new RegExp(this.otag+"%([\\w-]+) ?([\\w]+=[\\w]+)?"+this.ctag);return e.replace(f,function(j,h,i){if(!g.pragmas_implemented[h]){throw ({message:"This implementation of mustache doesn't understand the '"+h+"' pragma"})}g.pragmas[h]={};if(i){var k=i.split("=");g.pragmas[h][k[0]]=k[1]}return""})},render_partial:function(e,g,f){e=this.trim(e);if(!f||f[e]===undefined){throw ({message:"unknown_partial '"+e+"'"})}if(typeof(g[e])!="object"){return this.render(f[e],g,f,true)}return this.render(f[e],g[e],f,true)},render_section:function(g,f,e){if(!this.includes("#",g)&&!this.includes("^",g)){return g}var i=this;var h=new RegExp(this.otag+"(\\^|\\#)\\s*(.+)\\s*"+this.ctag+"\n*([\\s\\S]+?)"+this.otag+"\\/\\s*\\2\\s*"+this.ctag+"\\s*","mg");return g.replace(h,function(k,l,j,m){var n=i.find(j,f);if(l=="^"){if(!n||i.is_array(n)&&n.length===0){return i.render(m,f,e,true)}else{return""}}else{if(l=="#"){if(i.is_array(n)){return i.map(n,function(o){return i.render(m,i.create_context(o),e,true)}).join("")}else{if(i.is_object(n)){return i.render(m,i.create_context(n),e,true)}else{if(typeof n==="function"){return n.call(f,m,function(o){return i.render(o,f,e,true)})}else{if(n){return i.render(m,f,e,true)}else{return""}}}}}}})},render_tags:function(n,e,g,j){var h=this;var m=function(){return new RegExp(h.otag+"(=|!|>|\\{|%)?([^\\/#\\^]+?)\\1?"+h.ctag+"+","g")};var k=m();var l=function(q,i,p){switch(i){case"!":return"";case"=":h.set_delimiters(p);k=m();return"";case">":return h.render_partial(p,e,g);case"{":return h.find(p,e);default:return h.escape(h.find(p,e))}};var o=n.split("\n");for(var f=0;f<o.length;f++){o[f]=o[f].replace(k,l,this);if(!j){this.send(o[f])}}if(j){return o.join("\n")}},set_delimiters:function(f){var e=f.split(" ");this.otag=this.escape_regex(e[0]);this.ctag=this.escape_regex(e[1])},escape_regex:function(f){if(!arguments.callee.sRE){var e=["/",".","*","+","?","|","(",")","[","]","{","}","\\"];arguments.callee.sRE=new RegExp("(\\"+e.join("|\\")+")","g")}return f.replace(arguments.callee.sRE,"\\$1")},find:function(f,g){f=this.trim(f);function e(i){return i===false||i===0||i}var h;if(e(g[f])){h=g[f]}else{if(e(this.context[f])){h=this.context[f]}}if(typeof h==="function"){return h.apply(g)}if(h!==undefined){return h}return""},includes:function(f,e){return e.indexOf(this.otag+f)!=-1},escape:function(e){e=String(e===null?"":e);return e.replace(/&(?!\w+;)|["<>\\]/g,function(f){switch(f){case"&":return"&amp;";case"\\":return"\\\\";case'"':return'"';case"<":return"&lt;";case">":return"&gt;";default:return f}})},create_context:function(f){if(this.is_object(f)){return f}else{var g=".";if(this.pragmas["IMPLICIT-ITERATOR"]){g=this.pragmas["IMPLICIT-ITERATOR"].iterator}var e={};e[g]=f;return e}},is_object:function(e){return e&&typeof e=="object"},is_array:function(e){return Object.prototype.toString.call(e)==="[object Array]"},trim:function(e){return e.replace(/^\s*|\s*$/g,"")},map:function(j,g){if(typeof j.map=="function"){return j.map(g)}else{var h=[];var e=j.length;for(var f=0;f<e;f++){h.push(g(j[f]))}return h}}};return({name:"mustache.js",version:"0.3.0",to_html:function(g,e,f,i){var h=new d();if(i){h.send=i}h.render(g,e,f);if(!i){return h.buffer.join("\n")}}})}();
/*
  ICanHaz.js -- by @HenrikJoreteg
*/
function a(){var e=this,d={cache:{},partials:{}};this.VERSION="0.7";this.addTemplate=function(f,g){if(this[f]){throw"Can't add a template with reserved name: "+f+"."}else{if(d.cache.hasOwnProperty(f)){throw"You've already got a template by the name: \""+f+'"'}else{d.cache[f]=g;e[f]=function(j,i){j=j||{};var h=b.to_html(d.cache[f],j,d.partials);return i?h:c(h)}}}};this.addPartial=function(f,g){if(d.partials.hasOwnProperty(f)){throw'You\'ve already got a partial with the name: " + name + "'}else{d.partials[f]=g}};this.grabTemplates=function(){c('script[type="text/html"]').each(function(){var f=c(this),g=f.attr("id"),i=c.trim(f.html()),h=f.attr("class").toLowerCase()==="partial";if(h){e.addPartial(g,i)}else{e.addTemplate(g,i)}f.remove()})};this.showAll=function(){return{templates:c.extend({},d.cache),partials:c.extend({},d.partials)}};this.clearAll=function(){c.each(d.cache,function(f,g){delete e[f]});d.cache={};d.partials={}};this.refresh=function(){this.clearAll();this.grabTemplates()}}window.ich=new a();c(function(){ich.grabTemplates()})}(jQuery));/*
 * $Id: base64.js,v 0.9 2009/03/01 20:51:18 dankogai Exp dankogai $
 */

(function(){

var b64chars
    = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

var b64charcodes = function(){
    var a = [];
    var codeA = 'A'.charCodeAt(0);
    var codea = 'a'.charCodeAt(0);
    var code0 = '0'.charCodeAt(0);
    for (var i = 0; i < 26; i ++) a.push(codeA + i);
    for (var i = 0; i < 26; i ++) a.push(codea + i);
    for (var i = 0; i < 10; i ++) a.push(code0 + i);
    a.push('+'.charCodeAt(0));
    a.push('/'.charCodeAt(0));
    return a;
}();

var b64tab = function(bin){
    var t = {};
    for (var i = 0, l = bin.length; i < l; i++) t[bin.charAt(i)] = i;
    return t;
}(b64chars);

var stringToArray = function(s){
    var a = [];
    for (var i = 0, l = s.length; i < l; i ++) a[i] = s.charCodeAt(i);
    return a;
};

var convertUTF8ArrayToBase64 = function(bin){
    var padlen = 0;
    while (bin.length % 3){
        bin.push(0);
        padlen++;
    };
    var b64 = [];
    for (var i = 0, l = bin.length; i < l; i += 3){
        var c0 = bin[i], c1 = bin[i+1], c2 = bin[i+2];
        if (c0 >= 256 || c1 >= 256 || c2 >= 256)
            throw 'unsupported character found';
        var n = (c0 << 16) | (c1 << 8) | c2;
        b64.push(
            b64charcodes[ n >>> 18],
            b64charcodes[(n >>> 12) & 63],
            b64charcodes[(n >>>  6) & 63],
            b64charcodes[ n         & 63]
        );
    }
    while (padlen--) b64[b64.length - padlen - 1] = '='.charCodeAt(0);
    return String.fromCharCode.apply(String, b64);
};

var convertBase64ToUTF8Array = function(b64){
    b64 = b64.replace(/[^A-Za-z0-9+\/]+/g, '');
    var bin = [];
    var padlen = b64.length % 4;
    for (var i = 0, l = b64.length; i < l; i += 4){
        var n = ((b64tab[b64.charAt(i  )] || 0) << 18)
            |   ((b64tab[b64.charAt(i+1)] || 0) << 12)
            |   ((b64tab[b64.charAt(i+2)] || 0) <<  6)
            |   ((b64tab[b64.charAt(i+3)] || 0));
        bin.push(
            (  n >> 16 ),
            ( (n >>  8) & 0xff ),
            (  n        & 0xff )
        );
    }
    bin.length -= [0,0,2,1][padlen];
    return bin;
};

var convertUTF16ArrayToUTF8Array = function(uni){
    var bin = [];
    for (var i = 0, l = uni.length; i < l; i++){
        var n = uni[i];
        if (n < 0x80)
            bin.push(n);
        else if (n < 0x800)
            bin.push(
                0xc0 | (n >>>  6),
                0x80 | (n & 0x3f));
        else
            bin.push(
                0xe0 | ((n >>> 12) & 0x0f),
                0x80 | ((n >>>  6) & 0x3f),
                0x80 |  (n         & 0x3f));
    }
    return bin;
};

var convertUTF8ArrayToUTF16Array = function(bin){
    var uni = [];
    for (var i = 0, l = bin.length; i < l; i++){
        var c0 = bin[i];
        if    (c0 < 0x80){
            uni.push(c0);
        }else{
            var c1 = bin[++i];
            if (c0 < 0xe0){
                uni.push(((c0 & 0x1f) << 6) | (c1 & 0x3f));
            }else{
                var c2 = bin[++i];
                uni.push(
                       ((c0 & 0x0f) << 12) | ((c1 & 0x3f) << 6) | (c2 & 0x3f)
                );
            }
        }
    }
    return uni;
};

var convertUTF8StringToBase64 = function(bin){
    return convertUTF8ArrayToBase64(stringToArray(bin));
};

var convertBase64ToUTF8String = function(b64){
    return String.fromCharCode.apply(String, convertBase64ToUTF8Array(b64));
};

var convertUTF8StringToUTF16Array = function(bin){
    return convertUTF8ArrayToUTF16Array(stringToArray(bin));
};

var convertUTF8ArrayToUTF16String = function(bin){
    return String.fromCharCode.apply(String, convertUTF8ArrayToUTF16Array(bin));
};

var convertUTF8StringToUTF16String = function(bin){
    return String.fromCharCode.apply(String, convertUTF8ArrayToUTF16Array(stringToArray(bin)));
};

var convertUTF16StringToUTF8Array = function(uni){
    return convertUTF16ArrayToUTF8Array(stringToArray(uni));
};

var convertUTF16ArrayToUTF8String = function(uni){
    return String.fromCharCode.apply(String, convertUTF16ArrayToUTF8Array(uni));
};

var convertUTF16StringToUTF8String = function(uni){
    return String.fromCharCode.apply(String, convertUTF16ArrayToUTF8Array(stringToArray(uni)));
};

if (window.btoa){
    var btoa = window.btoa;
    var convertUTF16StringToBase64 = function (uni){
        return btoa(convertUTF16StringToUTF8String(uni));
    };
}
else {
    var btoa = convertUTF8StringToBase64;
    var convertUTF16StringToBase64 = function (uni){
        return convertUTF8ArrayToBase64(convertUTF16StringToUTF8Array(uni));
    };
}

if (window.atob){
    var atob = window.atob;
    var convertBase64ToUTF16String = function (b64){
        return convertUTF8StringToUTF16String(atob(b64));
    };
}
else {
    var atob = convertBase64ToUTF8String;
    var convertBase64ToUTF16String = function (b64){
        return convertUTF8ArrayToUTF16String(convertBase64ToUTF8Array(b64));
    };
}

window.Base64 = {
    convertUTF8ArrayToBase64:convertUTF8ArrayToBase64,
    convertByteArrayToBase64:convertUTF8ArrayToBase64,
    convertBase64ToUTF8Array:convertBase64ToUTF8Array,
    convertBase64ToByteArray:convertBase64ToUTF8Array,
    convertUTF16ArrayToUTF8Array:convertUTF16ArrayToUTF8Array,
    convertUTF16ArrayToByteArray:convertUTF16ArrayToUTF8Array,
    convertUTF8ArrayToUTF16Array:convertUTF8ArrayToUTF16Array,
    convertByteArrayToUTF16Array:convertUTF8ArrayToUTF16Array,
    convertUTF8StringToBase64:convertUTF8StringToBase64,
    convertBase64ToUTF8String:convertBase64ToUTF8String,
    convertUTF8StringToUTF16Array:convertUTF8StringToUTF16Array,
    convertUTF8ArrayToUTF16String:convertUTF8ArrayToUTF16String,
    convertByteArrayToUTF16String:convertUTF8ArrayToUTF16String,
    convertUTF8StringToUTF16String:convertUTF8StringToUTF16String,
    convertUTF16StringToUTF8Array:convertUTF16StringToUTF8Array,
    convertUTF16StringToByteArray:convertUTF16StringToUTF8Array,
    convertUTF16ArrayToUTF8String:convertUTF16ArrayToUTF8String,
    convertUTF16StringToUTF8String:convertUTF16StringToUTF8String,
    convertUTF16StringToBase64:convertUTF16StringToBase64,
    convertBase64ToUTF16String:convertBase64ToUTF16String,
    fromBase64:convertBase64ToUTF8String,
    toBase64:convertUTF8StringToBase64,
    atob:atob,
    btoa:btoa,
    utob:convertUTF16StringToUTF8String,
    btou:convertUTF8StringToUTF16String,
    encode:convertUTF16StringToBase64,
    encodeURI:function(u){
        return convertUTF16StringToBase64(u).replace(/[+\/]/g, function(m0){
            return m0 == '+' ? '-' : '_';
        }).replace(/=+$/, '');
    },
    decode:function(a){
        return convertBase64ToUTF16String(a.replace(/[-_]/g, function(m0){
            return m0 == '-' ? '+' : '/';
        }));
    }
};

})();
// All functions that need access to the editor's state live inside
// the CodeMirror function. Below that, at the bottom of the file,
// some utilities are defined.

// CodeMirror is the only global var we claim
var CodeMirror = (function() {
  // This is the function that produces an editor instance. It's
  // closure is used to store the editor state.
  function CodeMirror(place, givenOptions) {
    // Determine effective options based on given values and defaults.
    var options = {}, defaults = CodeMirror.defaults;
    for (var opt in defaults)
      if (defaults.hasOwnProperty(opt))
        options[opt] = (givenOptions && givenOptions.hasOwnProperty(opt) ? givenOptions : defaults)[opt];

    // The element in which the editor lives. Takes care of scrolling
    // (if enabled).
    var wrapper = document.createElement("div");
    wrapper.className = "CodeMirror";
    // This mess creates the base DOM structure for the editor.
    wrapper.innerHTML =
      '<div style="position: relative">' + // Set to the height of the text, causes scrolling
        '<pre style="position: relative; height: 0; visibility: hidden; overflow: hidden;">' + // To measure line/char size
           '<span>xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</span></pre>' +
        '<div style="position: relative">' + // Moved around its parent to cover visible view
          '<div class="CodeMirror-gutter"><div class="CodeMirror-gutter-text"></div></div>' +
          '<div style="overflow: hidden; position: absolute; width: 0; left: 0">' + // Wraps and hides input textarea
            '<textarea style="height: 1px; position: absolute; width: 1px;" wrap="off"></textarea></div>' +
          // Provides positioning relative to (visible) text origin
          '<div class="CodeMirror-lines"><div style="position: relative">' +
            '<pre class="CodeMirror-cursor">&#160;</pre>' + // Absolutely positioned blinky cursor
            '<div></div></div></div></div></div>'; // This DIV contains the actual code
    if (place.appendChild) place.appendChild(wrapper); else place(wrapper);
    // I've never seen more elegant code in my life.
    var code = wrapper.firstChild, measure = code.firstChild, mover = measure.nextSibling,
        gutter = mover.firstChild, gutterText = gutter.firstChild,
        inputDiv = gutter.nextSibling, input = inputDiv.firstChild,
        lineSpace = inputDiv.nextSibling.firstChild, cursor = lineSpace.firstChild, lineDiv = cursor.nextSibling;
    if (options.tabindex != null) input.tabindex = options.tabindex;
    if (!options.gutter && !options.lineNumbers) gutter.style.display = "none";

    // Delayed object wrap timeouts, making sure only one is active. blinker holds an interval.
    var poll = new Delayed(), highlight = new Delayed(), blinker;

    // mode holds a mode API object. lines an array of Line objects
    // (see Line constructor), work an array of lines that should be
    // parsed, and history the undo history (instance of History
    // constructor).
    var mode, lines = [new Line("")], work, history = new History(), focused;
    loadMode();
    // The selection. These are always maintained to point at valid
    // positions. Inverted is used to remember that the user is
    // selecting bottom-to-top.
    var sel = {from: {line: 0, ch: 0}, to: {line: 0, ch: 0}, inverted: false};
    // Selection-related flags. shiftSelecting obviously tracks
    // whether the user is holding shift. reducedSelection is a hack
    // to get around the fact that we can't create inverted
    // selections. See below.
    var shiftSelecting, reducedSelection;
    // Variables used by startOperation/endOperation to track what
    // happened during the operation.
    var updateInput, changes, textChanged, selectionChanged, leaveInputAlone;
    // Current visible range (may be bigger than the view window).
    var showingFrom = 0, showingTo = 0, lastHeight = 0, curKeyId = null;
    // editing will hold an object describing the things we put in the
    // textarea, to help figure out whether something changed.
    // bracketHighlighted is used to remember that a backet has been
    // marked.
    var editing, bracketHighlighted;

    // Initialize the content. Somewhat hacky (delayed prepareInput)
    // to work around browser issues.
    operation(function(){setValue(options.value || ""); updateInput = false;})();
    setTimeout(prepareInput, 20);

    // Register our event handlers.
    connect(wrapper, "mousedown", operation(onMouseDown));
    // Gecko browsers fire contextmenu *after* opening the menu, at
    // which point we can't mess with it anymore. Context menu is
    // handled in onMouseDown for Gecko.
    if (!gecko) connect(wrapper, "contextmenu", operation(onContextMenu));
    connect(code, "dblclick", operation(onDblClick));
    connect(wrapper, "scroll", function() {updateDisplay([]); if (options.onScroll) options.onScroll(instance);});
    connect(window, "resize", function() {updateDisplay(true);});
    connect(input, "keyup", operation(onKeyUp));
    connect(input, "keydown", operation(onKeyDown));
    connect(input, "keypress", operation(onKeyPress));
    connect(input, "focus", onFocus);
    connect(input, "blur", onBlur);

    connect(wrapper, "dragenter", function(e){e.stop();});
    connect(wrapper, "dragover", function(e){e.stop();});
    connect(wrapper, "drop", operation(onDrop));
    connect(wrapper, "paste", function(){input.focus(); fastPoll();});
    connect(input, "paste", function(){fastPoll();});
    connect(input, "cut", function(){fastPoll();});

    if (document.activeElement == input) onFocus();
    else onBlur();

    function isLine(l) {return l >= 0 && l < lines.length;}
    // The instance object that we'll return. Mostly calls out to
    // local functions in the CodeMirror function. Some do some extra
    // range checking and/or clipping. operation is used to wrap the
    // call so that changes it makes are tracked, and the display is
    // updated afterwards.
    var instance = {
      getValue: getValue,
      setValue: operation(setValue),
      getSelection: getSelection,
      replaceSelection: operation(replaceSelection),
      focus: function(){input.focus(); onFocus(); fastPoll();},
      setOption: function(option, value) {
        options[option] = value;
        if (option == "lineNumbers" || option == "gutter") gutterChanged();
        else if (option == "mode" || option == "indentUnit") loadMode();
      },
      getOption: function(option) {return options[option];},
      undo: operation(undo),
      redo: operation(redo),
      indentLine: operation(function(n) {if (isLine(n)) indentLine(n, "smart");}),
      historySize: function() {return {undo: history.done.length, redo: history.undone.length};},
      matchBrackets: operation(function(){matchBrackets(true);}),
      getTokenAt: function(pos) {
        pos = clipPos(pos);
        return lines[pos.line].getTokenAt(mode, getStateBefore(pos.line), pos.ch);
      },
      cursorCoords: function(start){
        if (start == null) start = sel.inverted;
        return pageCoords(start ? sel.from : sel.to);
      },
      charCoords: function(pos){return pageCoords(clipPos(pos));},
      coordsChar: function(coords) {
        var off = eltOffset(lineSpace);
        var line = Math.min(showingTo - 1, showingFrom + Math.floor(coords.y / lineHeight()));
        return clipPos({line: line, ch: charFromX(clipLine(line), coords.x)});
      },
      getSearchCursor: function(query, pos, caseFold) {return new SearchCursor(query, pos, caseFold);},
      markText: operation(function(a, b, c){return operation(markText(a, b, c));}),
      setMarker: addGutterMarker,
      clearMarker: removeGutterMarker,
      setLineClass: operation(setLineClass),
      lineInfo: lineInfo,
      addWidget: function(pos, node, scroll) {
        var pos = localCoords(clipPos(pos), true);
        node.style.top = (showingFrom * lineHeight() + pos.yBot + paddingTop()) + "px";
        node.style.left = (pos.x + paddingLeft()) + "px";
        code.appendChild(node);
        if (scroll)
          scrollIntoView(pos.x, pos.yBot, pos.x + node.offsetWidth, pos.yBot + node.offsetHeight);
      },

      lineCount: function() {return lines.length;},
      getCursor: function(start) {
        if (start == null) start = sel.inverted;
        return copyPos(start ? sel.from : sel.to);
      },
      somethingSelected: function() {return !posEq(sel.from, sel.to);},
      setCursor: operation(function(line, ch) {
        if (ch == null && typeof line.line == "number") setCursor(line.line, line.ch);
        else setCursor(line, ch);
      }),
      setSelection: operation(function(from, to) {setSelection(clipPos(from), clipPos(to || from));}),
      getLine: function(line) {if (isLine(line)) return lines[line].text;},
      setLine: operation(function(line, text) {
        if (isLine(line)) replaceRange(text, {line: line, ch: 0}, {line: line, ch: lines[line].text.length});
      }),
      removeLine: operation(function(line) {
        if (isLine(line)) replaceRange("", {line: line, ch: 0}, clipPos({line: line+1, ch: 0}));
      }),
      replaceRange: operation(replaceRange),
      getRange: function(from, to) {return getRange(clipPos(from), clipPos(to));},

      operation: function(f){return operation(f)();},
      refresh: function(){updateDisplay(true);},
      getInputField: function(){return input;},
      getWrapperElement: function(){return wrapper;}
    };

    function setValue(code) {
      history = null;
      var top = {line: 0, ch: 0};
      updateLines(top, {line: lines.length - 1, ch: lines[lines.length-1].text.length},
                  splitLines(code), top, top);
      history = new History();
    }
    function getValue(code) {
      var text = [];
      for (var i = 0, l = lines.length; i < l; ++i)
        text.push(lines[i].text);
      return text.join("\n");
    }

    function onMouseDown(e) {
      // First, see if this is a click in the gutter
      for (var n = e.target(); n != wrapper; n = n.parentNode)
        if (n.parentNode == gutterText) {
          if (options.onGutterClick)
            options.onGutterClick(instance, indexOf(gutterText.childNodes, n) + showingFrom);
          return e.stop();
        }

      if (gecko && e.button() == 3) onContextMenu(e);
      if (e.button() != 1) return;
      // For button 1, if it was clicked inside the editor
      // (posFromMouse returning non-null), we have to adjust the
      // selection.
      var start = posFromMouse(e), last = start, going;
      if (!start) {if (e.target() == wrapper) e.stop(); return;}
      setCursor(start.line, start.ch, false);

      if (!focused) onFocus();
      e.stop();
      // And then we have to see if it's a drag event, in which case
      // the dragged-over text must be selected.
      function end() {
        input.focus();
        updateInput = true;
        move(); up();
      }
      function extend(e) {
        var cur = posFromMouse(e, true);
        if (cur && !posEq(cur, last)) {
          if (!focused) onFocus();
          last = cur;
          setSelection(start, cur);
          updateInput = false;
          var visible = visibleLines();
          if (cur.line >= visible.to || cur.line < visible.from)
            going = setTimeout(operation(function(){extend(e);}), 150);
        }
      }

      var move = connect(document, "mousemove", operation(function(e) {
        clearTimeout(going);
        e.stop();
        extend(e);
      }), true);
      var up = connect(document, "mouseup", operation(function(e) {
        clearTimeout(going);
        var cur = posFromMouse(e);
        if (cur) setSelection(start, cur);
        e.stop();
        end();
      }), true);
    }
    function onDblClick(e) {
      var pos = posFromMouse(e);
      if (!pos) return;
      selectWordAt(pos);
      e.stop();
    }
    function onDrop(e) {
      var pos = posFromMouse(e, true), files = e.e.dataTransfer.files;
      if (!pos || options.readOnly) return;
      if (files && files.length && window.FileReader && window.File) {
        var n = files.length, text = Array(n), read = 0;
        for (var i = 0; i < n; ++i) loadFile(files[i], i);
        function loadFile(file, i) {
          var reader = new FileReader;
          reader.onload = function() {
            text[i] = reader.result;
            if (++read == n) replaceRange(text.join(""), clipPos(pos), clipPos(pos));
          };
          reader.readAsText(file);
        }
      }
      else {
        try {
          var text = e.e.dataTransfer.getData("Text");
          if (text) replaceRange(text, pos, pos);
        }
        catch(e){}
      }
    }
    function onKeyDown(e) {
      if (!focused) onFocus();

      var code = e.e.keyCode;
      // Tries to detect ctrl on non-mac, cmd on mac.
      var mod = (mac ? e.e.metaKey : e.e.ctrlKey) && !e.e.altKey, anyMod = e.e.ctrlKey || e.e.altKey || e.e.metaKey;
      if (code == 16 || e.e.shiftKey) shiftSelecting = shiftSelecting || (sel.inverted ? sel.to : sel.from);
      else shiftSelecting = null;
      // First give onKeyEvent option a chance to handle this.
      if (options.onKeyEvent && options.onKeyEvent(instance, addStop(e.e))) return;

      if (code == 33 || code == 34) {scrollPage(code == 34); return e.stop();} // page up/down
      if (mod && (code == 36 || code == 35)) {scrollEnd(code == 36); return e.stop();} // ctrl-home/end
      if (mod && code == 65) {selectAll(); return e.stop();} // ctrl-a
      if (!options.readOnly) {
        if (!anyMod && code == 13) {return;} // enter
        if (!anyMod && code == 9 && handleTab(e.e.shiftKey)) return e.stop(); // tab
        if (mod && code == 90) {undo(); return e.stop();} // ctrl-z
        if (mod && ((e.e.shiftKey && code == 90) || code == 89)) {redo(); return e.stop();} // ctrl-shift-z, ctrl-y
      }

      // Key id to use in the movementKeys map. We also pass it to
      // fastPoll in order to 'self learn'. We need this because
      // reducedSelection, the hack where we collapse the selection to
      // its start when it is inverted and a movement key is pressed
      // (and later restore it again), shouldn't be used for
      // non-movement keys.
      curKeyId = (mod ? "c" : "") + code;
      if (sel.inverted && movementKeys.hasOwnProperty(curKeyId)) {
        var range = selRange(input);
        if (range) {
          reducedSelection = {anchor: range.start};
          setSelRange(input, range.start, range.start);
        }
      }
      fastPoll(curKeyId);
    }
    function onKeyUp(e) {
      if (reducedSelection) {
        reducedSelection = null;
        updateInput = true;
      }
      if (e.e.keyCode == 16) shiftSelecting = null;
    }
    function onKeyPress(e) {
      if (options.onKeyEvent && options.onKeyEvent(instance, addStop(e.e))) return;
      if (options.electricChars && mode.electricChars) {
        var ch = String.fromCharCode(e.e.charCode == null ? e.e.keyCode : e.e.charCode);
        if (mode.electricChars.indexOf(ch) > -1)
          setTimeout(operation(function() {indentLine(sel.to.line, "smart");}), 50);
      }
      var code = e.e.keyCode;
      // Re-stop tab and enter. Necessary on some browsers.
      if (code == 13) {handleEnter(); e.stop();}
      else if (code == 9 && options.tabMode != "default") e.stop();
      else fastPoll(curKeyId);
    }

    function onFocus() {
      if (!focused && options.onFocus) options.onFocus(instance);
      focused = true;
      slowPoll();
      if (wrapper.className.search(/\bCodeMirror-focused\b/) == -1)
        wrapper.className += " CodeMirror-focused";
      restartBlink();
    }
    function onBlur() {
      if (focused && options.onBlur) options.onBlur(instance);
      clearInterval(blinker);
      shiftSelecting = null;
      focused = false;
      wrapper.className = wrapper.className.replace(" CodeMirror-focused", "");
    }

    // Replace the range from from to to by the strings in newText.
    // Afterwards, set the selection to selFrom, selTo.
    function updateLines(from, to, newText, selFrom, selTo) {
      if (history) {
        var old = [];
        for (var i = from.line, e = to.line + 1; i < e; ++i) old.push(lines[i].text);
        history.addChange(from.line, newText.length, old);
        while (history.done.length > options.undoDepth) history.done.shift();
      }
      updateLinesNoUndo(from, to, newText, selFrom, selTo);
    }
    function unredoHelper(from, to) {
      var change = from.pop();
      if (change) {
        var replaced = [], end = change.start + change.added;
        for (var i = change.start; i < end; ++i) replaced.push(lines[i].text);
        to.push({start: change.start, added: change.old.length, old: replaced});
        var pos = clipPos({line: change.start + change.old.length - 1,
                           ch: editEnd(replaced[replaced.length-1], change.old[change.old.length-1])});
        updateLinesNoUndo({line: change.start, ch: 0}, {line: end - 1, ch: lines[end-1].text.length}, change.old, pos, pos);
      }
    }
    function undo() {unredoHelper(history.done, history.undone);}
    function redo() {unredoHelper(history.undone, history.done);}

    function updateLinesNoUndo(from, to, newText, selFrom, selTo) {
      var nlines = to.line - from.line, firstLine = lines[from.line], lastLine = lines[to.line];
      // First adjust the line structure, taking some care to leave highlighting intact.
      if (firstLine == lastLine) {
        if (newText.length == 1)
          firstLine.replace(from.ch, to.ch, newText[0]);
        else {
          lastLine = firstLine.split(to.ch, newText[newText.length-1]);
          var spliceargs = [from.line + 1, nlines];
          firstLine.replace(from.ch, firstLine.text.length, newText[0]);
          for (var i = 1, e = newText.length - 1; i < e; ++i) spliceargs.push(new Line(newText[i]));
          spliceargs.push(lastLine);
          lines.splice.apply(lines, spliceargs);
        }
      }
      else if (newText.length == 1) {
        firstLine.replace(from.ch, firstLine.text.length, newText[0] + lastLine.text.slice(to.ch));
        lines.splice(from.line + 1, nlines);
      }
      else {
        var spliceargs = [from.line + 1, nlines - 1];
        firstLine.replace(from.ch, firstLine.text.length, newText[0]);
        lastLine.replace(0, to.ch, newText[newText.length-1]);
        for (var i = 1, e = newText.length - 1; i < e; ++i) spliceargs.push(new Line(newText[i]));
        lines.splice.apply(lines, spliceargs);
      }

      // Add these lines to the work array, so that they will be
      // highlighted. Adjust work lines if lines were added/removed.
      var newWork = [], lendiff = newText.length - nlines - 1;
      for (var i = 0, l = work.length; i < l; ++i) {
        var task = work[i];
        if (task < from.line) newWork.push(task);
        else if (task > to.line) newWork.push(task + lendiff);
      }
      if (newText.length) newWork.push(from.line);
      work = newWork;
      startWorker(100);
      // Remember that these lines changed, for updating the display
      changes.push({from: from.line, to: to.line + 1, diff: lendiff});
      textChanged = true;

      // Update the selection
      function updateLine(n) {return n <= Math.min(to.line, to.line + lendiff) ? n : n + lendiff;}
      setSelection(selFrom, selTo, updateLine(sel.from.line), updateLine(sel.to.line));

      // Make sure the scroll-size div has the correct height.
      code.style.height = (lines.length * lineHeight() + 2 * paddingTop()) + "px";
    }

    function replaceRange(code, from, to) {
      from = clipPos(from);
      if (!to) to = from; else to = clipPos(to);
      code = splitLines(code);
      function adjustPos(pos) {
        if (posLess(pos, from)) return pos;
        if (!posLess(to, pos)) return end;
        var line = pos.line + code.length - (to.line - from.line) - 1;
        var ch = pos.ch;
        if (pos.line == to.line)
          ch += code[code.length-1].length - (to.ch - (to.line == from.line ? from.ch : 0));
        return {line: line, ch: ch};
      }
      var end;
      replaceRange1(code, from, to, function(end1) {
        end = end1;
        return {from: adjustPos(sel.from), to: adjustPos(sel.to)};
      });
      return end;
    }
    function replaceSelection(code, collapse) {
      replaceRange1(splitLines(code), sel.from, sel.to, function(end) {
        if (collapse == "end") return {from: end, to: end};
        else if (collapse == "start") return {from: sel.from, to: sel.from};
        else return {from: sel.from, to: end};
      });
    }
    function replaceRange1(code, from, to, computeSel) {
      var endch = code.length == 1 ? code[0].length + from.ch : code[code.length-1].length;
      var newSel = computeSel({line: from.line + code.length - 1, ch: endch});
      updateLines(from, to, code, newSel.from, newSel.to);
    }

    function getRange(from, to) {
      var l1 = from.line, l2 = to.line;
      if (l1 == l2) return lines[l1].text.slice(from.ch, to.ch);
      var code = [lines[l1].text.slice(from.ch)];
      for (var i = l1 + 1; i < l2; ++i) code.push(lines[i].text);
      code.push(lines[l2].text.slice(0, to.ch));
      return code.join("\n");
    }
    function getSelection() {
      return getRange(sel.from, sel.to);
    }

    var pollingFast = false; // Ensures slowPoll doesn't cancel fastPoll
    function slowPoll() {
      if (pollingFast) return;
      poll.set(2000, function() {
        startOperation();
        readInput();
        if (focused) slowPoll();
        endOperation();
      });
    }
    function fastPoll(keyId) {
      var missed = false;
      pollingFast = true;
      function p() {
        startOperation();
        var changed = readInput();
        if (changed == "moved" && keyId) movementKeys[keyId] = true;
        if (!changed && !missed) {missed = true; poll.set(80, p);}
        else {pollingFast = false; slowPoll();}
        endOperation();
      }
      poll.set(20, p);
    }

    // Inspects the textarea, compares its state (content, selection)
    // to the data in the editing variable, and updates the editor
    // content or cursor if something changed.
    function readInput() {
      var changed = false, text = input.value, sr = selRange(input);
      if (!sr) return false;
      var changed = editing.text != text, rs = reducedSelection;
      var moved = changed || sr.start != editing.start || sr.end != (rs ? editing.start : editing.end);
      if (reducedSelection && !moved && sel.from.line == 0 && sel.from.ch == 0)
        reducedSelection = null;
      else if (!moved) return false;
      if (changed) {
        shiftSelecting = reducedSelection = null;
        if (options.readOnly) {updateInput = true; return "changed";}
      }

      // Compute selection start and end based on start/end offsets in textarea
      function computeOffset(n, startLine) {
        var pos = 0;
        for (;;) {
          var found = text.indexOf("\n", pos);
          if (found == -1 || (text.charAt(found-1) == "\r" ? found - 1 : found) >= n)
            return {line: startLine, ch: n - pos};
          ++startLine;
          pos = found + 1;
        }
      }
      var from = computeOffset(sr.start, editing.from),
          to = computeOffset(sr.end, editing.from);
      // Here we have to take the reducedSelection hack into account,
      // so that you can, for example, press shift-up at the start of
      // your selection and have the right thing happen.
      if (rs) {
        from = sr.start == rs.anchor ? to : from;
        to = shiftSelecting ? sel.to : sr.start == rs.anchor ? from : to;
        if (!posLess(from, to)) {
          reducedSelection = null;
          sel.inverted = false;
          var tmp = from; from = to; to = tmp;
        }
      }

      // In some cases (cursor on same line as before), we don't have
      // to update the textarea content at all.
      if (from.line == to.line && from.line == sel.from.line && from.line == sel.to.line && !shiftSelecting)
        updateInput = false;

      // Magic mess to extract precise edited range from the changed
      // string.
      if (changed) {
        var start = 0, end = text.length, len = Math.min(end, editing.text.length);
        var c, line = editing.from, nl = -1;
        while (start < len && (c = text.charAt(start)) == editing.text.charAt(start)) {
          ++start;
          if (c == "\n") {line++; nl = start;}
        }
        var ch = nl > -1 ? start - nl : start, endline = editing.to - 1, edend = editing.text.length;
        for (;;) {
          c = editing.text.charAt(edend);
          if (c == "\n") endline--;
          if (text.charAt(end) != c) {++end; ++edend; break;}
          if (edend <= start || end <= start) break;
          --end; --edend;
        }
        var nl = editing.text.lastIndexOf("\n", edend - 1), endch = nl == -1 ? edend : edend - nl - 1;
        updateLines({line: line, ch: ch}, {line: endline, ch: endch}, splitLines(text.slice(start, end)), from, to);
        if (line != endline || from.line != line) updateInput = true;
      }
      else setSelection(from, to);

      editing.text = text; editing.start = sr.start; editing.end = sr.end;
      return changed ? "changed" : moved ? "moved" : false;
    }

    // Set the textarea content and selection range to match the
    // editor state.
    function prepareInput() {
      var text = [];
      var from = Math.max(0, sel.from.line - 1), to = Math.min(lines.length, sel.to.line + 2);
      for (var i = from; i < to; ++i) text.push(lines[i].text);
      text = input.value = text.join(lineSep);
      var startch = sel.from.ch, endch = sel.to.ch;
      for (var i = from; i < sel.from.line; ++i)
        startch += lineSep.length + lines[i].text.length;
      for (var i = from; i < sel.to.line; ++i)
        endch += lineSep.length + lines[i].text.length;
      editing = {text: text, from: from, to: to, start: startch, end: endch};
      setSelRange(input, startch, reducedSelection ? startch : endch);
    }

    function scrollCursorIntoView() {
      var cursor = localCoords(sel.inverted ? sel.from : sel.to);
      return scrollIntoView(cursor.x, cursor.y, cursor.x, cursor.yBot);
    }
    function scrollIntoView(x1, y1, x2, y2) {
      var pl = paddingLeft(), pt = paddingTop();
      y1 += pt; y2 += pt; x1 += pl; x2 += pl;
      var screen = wrapper.clientHeight, screentop = wrapper.scrollTop, scrolled = false, result = true;
      if (y1 < screentop) {wrapper.scrollTop = Math.max(0, y1 - 10); scrolled = true;}
      else if (y2 > screentop + screen) {wrapper.scrollTop = y2 + 10 - screen; scrolled = true;}

      var screenw = wrapper.clientWidth, screenleft = wrapper.scrollLeft;
      if (x1 < screenleft) {wrapper.scrollLeft = Math.max(0, x1 - 10); scrolled = true;}
      else if (x2 > screenw + screenleft) {
        wrapper.scrollLeft = x2 + 10 - screenw;
        scrolled = true;
        if (x2 > code.clientWidth) result = false;
      }
      if (scrolled && options.onScroll) options.onScroll(instance);
      return result;
    }

    function visibleLines() {
      var lh = lineHeight(), top = wrapper.scrollTop - paddingTop();
      return {from: Math.min(lines.length, Math.max(0, Math.floor(top / lh))),
              to: Math.min(lines.length, Math.ceil((top + wrapper.clientHeight) / lh))};
    }
    // Uses a set of changes plus the current scroll position to
    // determine which DOM updates have to be made, and makes the
    // updates.
    function updateDisplay(changes) {
      if (!wrapper.clientWidth) {
        showingFrom = showingTo = 0;
        return;
      }
      // First create a range of theoretically intact lines, and punch
      // holes in that using the change info.
      var intact = changes === true ? [] : [{from: showingFrom, to: showingTo, domStart: 0}];
      for (var i = 0, l = changes.length || 0; i < l; ++i) {
        var change = changes[i], intact2 = [], diff = change.diff || 0;
        for (var j = 0, l2 = intact.length; j < l2; ++j) {
          var range = intact[j];
          if (change.to <= range.from)
            intact2.push({from: range.from + diff, to: range.to + diff, domStart: range.domStart});
          else if (range.to <= change.from)
            intact2.push(range);
          else {
            if (change.from > range.from)
              intact2.push({from: range.from, to: change.from, domStart: range.domStart})
            if (change.to < range.to)
              intact2.push({from: change.to + diff, to: range.to + diff,
                            domStart: range.domStart + (change.to - range.from)});
          }
        }
        intact = intact2;
      }

      // Then, determine which lines we'd want to see, and which
      // updates have to be made to get there.
      var visible = visibleLines();
      var from = Math.min(showingFrom, Math.max(visible.from - 3, 0)),
          to = Math.min(lines.length, Math.max(showingTo, visible.to + 3)),
          updates = [], domPos = 0, domEnd = showingTo - showingFrom, pos = from, changedLines = 0;

      for (var i = 0, l = intact.length; i < l; ++i) {
        var range = intact[i];
        if (range.to <= from) continue;
        if (range.from >= to) break;
        if (range.domStart > domPos || range.from > pos) {
          updates.push({from: pos, to: range.from, domSize: range.domStart - domPos, domStart: domPos});
          changedLines += range.from - pos;
        }
        pos = range.to;
        domPos = range.domStart + (range.to - range.from);
      }
      if (domPos != domEnd || pos != to) {
        changedLines += Math.abs(to - pos);
        updates.push({from: pos, to: to, domSize: domEnd - domPos, domStart: domPos});
      }

      if (!updates.length) return;
      lineDiv.style.display = "none";
      // If more than 30% of the screen needs update, just do a full
      // redraw (which is quicker than patching)
      if (changedLines > (visible.to - visible.from) * .3)
        refreshDisplay(from = Math.max(visible.from - 10, 0), to = Math.min(visible.to + 7, lines.length));
      // Otherwise, only update the stuff that needs updating.
      else
        patchDisplay(updates);
      lineDiv.style.display = "";

      // Position the mover div to align with the lines it's supposed
      // to be showing (which will cover the visible display)
      var different = from != showingFrom || to != showingTo || lastHeight != wrapper.clientHeight;
      showingFrom = from; showingTo = to;
      mover.style.top = (from * lineHeight()) + "px";
      if (different) {
        lastHeight = wrapper.clientHeight;
        code.style.height = (lines.length * lineHeight() + 2 * paddingTop()) + "px";
        updateGutter();
      }

      // Since this is all rather error prone, it is honoured with the
      // only assertion in the whole file.
      if (lineDiv.childNodes.length != showingTo - showingFrom)
        throw new Error("BAD PATCH! " + JSON.stringify(updates) + " size=" + (showingTo - showingFrom) +
                        " nodes=" + lineDiv.childNodes.length);
      updateCursor();
    }

    function refreshDisplay(from, to) {
      var html = [], start = {line: from, ch: 0}, inSel = posLess(sel.from, start) && !posLess(sel.to, start);
      for (var i = from; i < to; ++i) {
        var ch1 = null, ch2 = null;
        if (inSel) {
          ch1 = 0;
          if (sel.to.line == i) {inSel = false; ch2 = sel.to.ch;}
        }
        else if (sel.from.line == i) {
          if (sel.to.line == i) {ch1 = sel.from.ch; ch2 = sel.to.ch;}
          else {inSel = true; ch1 = sel.from.ch;}
        }
        html.push(lines[i].getHTML(ch1, ch2, true));
      }
      lineDiv.innerHTML = html.join("");
    }
    function patchDisplay(updates) {
      // Slightly different algorithm for IE (badInnerHTML), since
      // there .innerHTML on PRE nodes is dumb, and discards
      // whitespace.
      var sfrom = sel.from.line, sto = sel.to.line, off = 0,
          scratch = badInnerHTML && document.createElement("div");
      for (var i = 0, e = updates.length; i < e; ++i) {
        var rec = updates[i];
        var extra = (rec.to - rec.from) - rec.domSize;
        var nodeAfter = lineDiv.childNodes[rec.domStart + rec.domSize + off] || null;
        if (badInnerHTML)
          for (var j = Math.max(-extra, rec.domSize); j > 0; --j)
            lineDiv.removeChild(nodeAfter ? nodeAfter.previousSibling : lineDiv.lastChild);
        else if (extra) {
          for (var j = Math.max(0, extra); j > 0; --j)
            lineDiv.insertBefore(document.createElement("pre"), nodeAfter);
          for (var j = Math.max(0, -extra); j > 0; --j)
            lineDiv.removeChild(nodeAfter ? nodeAfter.previousSibling : lineDiv.lastChild);
        }
        var node = lineDiv.childNodes[rec.domStart + off], inSel = sfrom < rec.from && sto >= rec.from;
        for (var j = rec.from; j < rec.to; ++j) {
          var ch1 = null, ch2 = null;
          if (inSel) {
            ch1 = 0;
            if (sto == j) {inSel = false; ch2 = sel.to.ch;}
          }
          else if (sfrom == j) {
            if (sto == j) {ch1 = sel.from.ch; ch2 = sel.to.ch;}
            else {inSel = true; ch1 = sel.from.ch;}
          }
          if (badInnerHTML) {
            scratch.innerHTML = lines[j].getHTML(ch1, ch2, true);
            lineDiv.insertBefore(scratch.firstChild, nodeAfter);
          }
          else {
            node.innerHTML = lines[j].getHTML(ch1, ch2, false);
            node.className = lines[j].className || "";
            node = node.nextSibling;
          }
        }
        off += extra;
      }
    }

    function updateGutter() {
      if (!options.gutter && !options.lineNumbers) return;
      var hText = mover.offsetHeight, hEditor = wrapper.clientHeight;
      gutter.style.height = (hText - hEditor < 2 ? hEditor : hText) + "px";
      var html = [];
      for (var i = showingFrom; i < showingTo; ++i) {
        var marker = lines[i].gutterMarker;
        var text = options.lineNumbers ? i + options.firstLineNumber : null;
        if (marker && marker.text)
          text = marker.text.replace("%N%", text != null ? text : "");
        else if (text == null)
          text = "\u00a0";
        html.push((marker && marker.style ? '<pre class="' + marker.style + '">' : "<pre>"), text, "</pre>");
      }
      gutter.style.display = "none";
      gutterText.innerHTML = html.join("");
      var minwidth = String(lines.length).length, firstNode = gutterText.firstChild, val = eltText(firstNode), pad = "";
      while (val.length + pad.length < minwidth) pad += "\u00a0";
      if (pad) firstNode.insertBefore(document.createTextNode(pad), firstNode.firstChild);
      gutter.style.display = "";
      lineSpace.style.marginLeft = gutter.offsetWidth + "px";
    }
    function updateCursor() {
      var head = sel.inverted ? sel.from : sel.to;
      var x = charX(head.line, head.ch) + "px", y = (head.line - showingFrom) * lineHeight() + "px";
      inputDiv.style.top = y; inputDiv.style.left = x;
      if (posEq(sel.from, sel.to)) {
        cursor.style.top = y; cursor.style.left = x;
        cursor.style.display = "";
      }
      else cursor.style.display = "none";
    }

    // Update the selection. Last two args are only used by
    // updateLines, since they have to be expressed in the line
    // numbers before the update.
    function setSelection(from, to, oldFrom, oldTo) {
      if (posEq(sel.from, from) && posEq(sel.to, to)) return;
      var sh = shiftSelecting && clipPos(shiftSelecting);
      if (posLess(to, from)) {var tmp = to; to = from; from = tmp;}
      if (sh) {
        if (posLess(sh, from)) from = sh;
        else if (posLess(to, sh)) to = sh;
      }

      var startEq = posEq(sel.to, to), endEq = posEq(sel.from, from);
      if (posEq(from, to)) sel.inverted = false;
      else if (startEq && !endEq) sel.inverted = true;
      else if (endEq && !startEq) sel.inverted = false;

      // Some ugly logic used to only mark the lines that actually did
      // see a change in selection as changed, rather than the whole
      // selected range.
      if (oldFrom == null) {oldFrom = sel.from.line; oldTo = sel.to.line;}
      if (posEq(from, to)) {
        if (!posEq(sel.from, sel.to))
          changes.push({from: oldFrom, to: oldTo + 1});
      }
      else if (posEq(sel.from, sel.to)) {
        changes.push({from: from.line, to: to.line + 1});
      }
      else {
        if (!posEq(from, sel.from)) {
          if (from.line < oldFrom)
            changes.push({from: from.line, to: Math.min(to.line, oldFrom) + 1});
          else
            changes.push({from: oldFrom, to: Math.min(oldTo, from.line) + 1});
        }
        if (!posEq(to, sel.to)) {
          if (to.line < oldTo)
            changes.push({from: Math.max(oldFrom, from.line), to: oldTo + 1});
          else
            changes.push({from: Math.max(from.line, oldTo), to: to.line + 1});
        }
      }
      sel.from = from; sel.to = to;
      selectionChanged = true;
    }
    function setCursor(line, ch) {
      var pos = clipPos({line: line, ch: ch || 0});
      setSelection(pos, pos);
    }

    function clipLine(n) {return Math.max(0, Math.min(n, lines.length-1));}
    function clipPos(pos) {
      if (pos.line < 0) return {line: 0, ch: 0};
      if (pos.line >= lines.length) return {line: lines.length-1, ch: lines[lines.length-1].text.length};
      var ch = pos.ch, linelen = lines[pos.line].text.length;
      if (ch == null || ch > linelen) return {line: pos.line, ch: linelen};
      else if (ch < 0) return {line: pos.line, ch: 0};
      else return pos;
    }

    function scrollPage(down) {
      var linesPerPage = Math.floor(wrapper.clientHeight / lineHeight()), head = sel.inverted ? sel.from : sel.to;
      setCursor(head.line + (Math.max(linesPerPage - 1, 1) * (down ? 1 : -1)), head.ch);
    }
    function scrollEnd(top) {
      setCursor(top ? 0 : lines.length - 1);
    }
    function selectAll() {
      var endLine = lines.length - 1;
      setSelection({line: 0, ch: 0}, {line: endLine, ch: lines[endLine].text.length});
    }
    function selectWordAt(pos) {
      var line = lines[pos.line].text;
      var start = pos.ch, end = pos.ch;
      while (start > 0 && /\w/.test(line.charAt(start - 1))) --start;
      while (end < line.length - 1 && /\w/.test(line.charAt(end))) ++end;
      setSelection({line: pos.line, ch: start}, {line: pos.line, ch: end});
    }
    function handleEnter() {
      replaceSelection("\n", "end");
      if (options.enterMode != "flat")
        indentLine(sel.from.line, options.enterMode == "keep" ? "prev" : "smart");
    }
    function handleTab(shift) {
      shiftSelecting = null;
      switch (options.tabMode) {
      case "default":
        return false;
      case "indent":
        for (var i = sel.from.line, e = sel.to.line; i <= e; ++i) indentLine(i, "smart");
        break;
      case "classic":
        if (posEq(sel.from, sel.to)) {
          if (shift) indentLine(sel.from.line, "smart");
          else replaceSelection("\t", "end");
          break;
        }
      case "shift":
        for (var i = sel.from.line, e = sel.to.line; i <= e; ++i) indentLine(i, shift ? "subtract" : "add");
        break;
      }
      return true;
    }

    function indentLine(n, how) {
      if (how == "smart") {
        if (!mode.indent) how = "prev";
        else var state = getStateBefore(n);
      }

      var line = lines[n], curSpace = line.indentation(), curSpaceString = line.text.match(/^\s*/)[0], indentation;
      if (how == "prev") {
        if (n) indentation = lines[n-1].indentation();
        else indentation = 0;
      }
      else if (how == "smart") indentation = mode.indent(state, line.text.slice(curSpaceString.length));
      else if (how == "add") indentation = curSpace + options.indentUnit;
      else if (how == "subtract") indentation = curSpace - options.indentUnit;
      indentation = Math.max(0, indentation);
      var diff = indentation - curSpace;

      if (!diff) {
        if (sel.from.line != n && sel.to.line != n) return;
        var indentString = curSpaceString;
      }
      else {
        var indentString = "", pos = 0;
        if (options.indentWithTabs)
          for (var i = Math.floor(indentation / tabSize); i; --i) {pos += tabSize; indentString += "\t";}
        while (pos < indentation) {++pos; indentString += " ";}
      }

      replaceRange(indentString, {line: n, ch: 0}, {line: n, ch: curSpaceString.length});
    }

    function loadMode() {
      mode = CodeMirror.getMode(options, options.mode);
      for (var i = 0, l = lines.length; i < l; ++i)
        lines[i].stateAfter = null;
      work = [0];
    }
    function gutterChanged() {
      var visible = options.gutter || options.lineNumbers;
      gutter.style.display = visible ? "" : "none";
      if (visible) updateGutter();
      else lineDiv.parentNode.style.marginLeft = 0;
    }

    function markText(from, to, className) {
      from = clipPos(from); to = clipPos(to);
      var accum = [];
      function add(line, from, to, className) {
        var line = lines[line], mark = line.addMark(from, to, className);
        mark.line = line;
        accum.push(mark);
      }
      if (from.line == to.line) add(from.line, from.ch, to.ch, className);
      else {
        add(from.line, from.ch, null, className);
        for (var i = from.line + 1, e = to.line; i < e; ++i)
          add(i, 0, null, className);
        add(to.line, 0, to.ch, className);
      }
      changes.push({from: from.line, to: to.line + 1});
      return function() {
        var start, end;
        for (var i = 0; i < accum.length; ++i) {
          var mark = accum[i], found = indexOf(lines, mark.line);
          mark.line.removeMark(mark);
          if (found > -1) {
            if (start == null) start = found;
            end = found;
          }
        }
        if (start != null) changes.push({from: start, to: end + 1});
      };
    }

    function addGutterMarker(line, text, className) {
      if (typeof line == "number") line = lines[clipLine(line)];
      line.gutterMarker = {text: text, style: className};
      updateGutter();
      return line;
    }
    function removeGutterMarker(line) {
      if (typeof line == "number") line = lines[clipLine(line)];
      line.gutterMarker = null;
      updateGutter();
    }
    function setLineClass(line, className) {
      if (typeof line == "number") {
        var no = line;
        line = lines[clipLine(line)];
      }
      else {
        var no = indexOf(lines, line);
        if (no == -1) return null;
      }
      line.className = className;
      changes.push({from: no, to: no + 1});
      return line;
    }

    function lineInfo(line) {
      if (typeof line == "number") {
        var n = line;
        line = lines[line];
        if (!line) return null;
      }
      else {
        var n = indexOf(lines, line);
        if (n == -1) return null;
      }
      var marker = line.gutterMarker;
      return {line: n, text: line.text, markerText: marker && marker.text, markerClass: marker && marker.style};
    }

    // These are used to go from pixel positions to character
    // positions, taking tabs into account.
    function charX(line, pos) {
      var text = lines[line].text, span = measure.firstChild;
      if (text.lastIndexOf("\t", pos) == -1) return pos * charWidth();
      var old = span.firstChild.nodeValue;
      try {
        span.firstChild.nodeValue = text.slice(0, pos);
        return span.offsetWidth;
      } finally {span.firstChild.nodeValue = old;}
    }
    function charFromX(line, x) {
      var text = lines[line].text, cw = charWidth();
      if (x <= 0) return 0;
      if (text.indexOf("\t") == -1) return Math.min(text.length, Math.round(x / cw));
      var mspan = measure.firstChild, mtext = mspan.firstChild, old = mtext.nodeValue;
      try {
        mtext.nodeValue = text;
        var from = 0, fromX = 0, to = text.length, toX = mspan.offsetWidth;
        if (x > toX) return to;
        for (;;) {
          if (to - from <= 1) return (toX - x > x - fromX) ? from : to;
          var middle = Math.ceil((from + to) / 2);
          mtext.nodeValue = text.slice(0, middle);
          var curX = mspan.offsetWidth;
          if (curX > x) {to = middle; toX = curX;}
          else {from = middle; fromX = curX;}
        }
      } finally {mtext.nodeValue = old;}
    }

    function localCoords(pos, inLineWrap) {
      var lh = lineHeight(), line = pos.line - (inLineWrap ? showingFrom : 0);
      return {x: charX(pos.line, pos.ch), y: line * lh, yBot: (line + 1) * lh};
    }
    function pageCoords(pos) {
      var local = localCoords(pos, true), off = eltOffset(lineSpace);
      return {x: off.left + local.x, y: off.top + local.y, yBot: off.top + local.yBot};
    }

    function lineHeight() {
      var nlines = lineDiv.childNodes.length;
      if (nlines) return lineDiv.offsetHeight / nlines;
      else return measure.firstChild.offsetHeight || 1;
    }
    function charWidth() {return (measure.firstChild.offsetWidth || 320) / 40;}
    function paddingTop() {return lineSpace.offsetTop;}
    function paddingLeft() {return lineSpace.offsetLeft;}

    function posFromMouse(e, liberal) {
      var off = eltOffset(lineSpace),
          x = e.pageX() - off.left,
          y = e.pageY() - off.top;
      if (!liberal && e.target() != lineSpace.parentNode && !(e.target() == wrapper && y > (lines.length * lineHeight())))
        for (var n = e.target(); n != lineDiv && n != cursor; n = n.parentNode)
          if (!n || n == wrapper) return null;
      var line = showingFrom + Math.floor(y / lineHeight());
      return clipPos({line: line, ch: charFromX(clipLine(line), x)});
    }
    function onContextMenu(e) {
      var pos = posFromMouse(e);
      if (!pos || window.opera) return; // Opera is difficult.
      if (posEq(sel.from, sel.to) || posLess(pos, sel.from) || !posLess(pos, sel.to))
        setCursor(pos.line, pos.ch);

      var oldCSS = input.style.cssText;
      input.style.cssText = "position: fixed; width: 30px; height: 30px; top: " + (e.pageY() - 1) +
        "px; left: " + (e.pageX() - 1) + "px; z-index: 1000; background: white; " +
        "border-width: 0; outline: none; overflow: hidden;";
      var val = input.value = getSelection();
      input.focus();
      setSelRange(input, 0, val.length);
      if (gecko) e.stop();
      leaveInputAlone = true;
      setTimeout(function() {
        if (input.value != val) operation(replaceSelection)(input.value, "end");
        input.style.cssText = oldCSS;
        leaveInputAlone = false;
        prepareInput();
        slowPoll();
      }, 50);
    }

    // Cursor-blinking
    function restartBlink() {
      clearInterval(blinker);
      var on = true;
      cursor.style.visibility = "";
      blinker = setInterval(function() {
        cursor.style.visibility = (on = !on) ? "" : "hidden";
      }, 650);
    }

    var matching = {"(": ")>", ")": "(<", "[": "]>", "]": "[<", "{": "}>", "}": "{<"};
    function matchBrackets(autoclear) {
      var head = sel.inverted ? sel.from : sel.to, line = lines[head.line], pos = head.ch - 1;
      var match = (pos >= 0 && matching[line.text.charAt(pos)]) || matching[line.text.charAt(++pos)];
      if (!match) return;
      var ch = match.charAt(0), forward = match.charAt(1) == ">", d = forward ? 1 : -1, st = line.styles;
      for (var off = pos + 1, i = 0, e = st.length; i < e; i+=2)
        if ((off -= st[i].length) <= 0) {var style = st[i+1]; break;}

      var stack = [line.text.charAt(pos)], re = /[(){}[\]]/;
      function scan(line, from, to) {
        if (!line.text) return;
        var st = line.styles, pos = forward ? 0 : line.text.length - 1, cur;
        for (var i = forward ? 0 : st.length - 2, e = forward ? st.length : -2; i != e; i += 2*d) {
          var text = st[i];
          if (st[i+1] != null && st[i+1] != style) {pos += d * text.length; continue;}
          for (var j = forward ? 0 : text.length - 1, te = forward ? text.length : -1; j != te; j += d, pos+=d) {
            if (pos >= from && pos < to && re.test(cur = text.charAt(j))) {
              var match = matching[cur];
              if (match.charAt(1) == ">" == forward) stack.push(cur);
              else if (stack.pop() != match.charAt(0)) return {pos: pos, match: false};
              else if (!stack.length) return {pos: pos, match: true};
            }
          }
        }
      }
      for (var i = head.line, e = forward ? Math.min(i + 50, lines.length) : Math.max(0, i - 50); i != e; i+=d) {
        var line = lines[i], first = i == head.line;
        var found = scan(line, first && forward ? pos + 1 : 0, first && !forward ? pos : line.text.length);
        if (found) {
          var style = found.match ? "CodeMirror-matchingbracket" : "CodeMirror-nonmatchingbracket";
          var one = markText({line: head.line, ch: pos}, {line: head.line, ch: pos+1}, style),
              two = markText({line: i, ch: found.pos}, {line: i, ch: found.pos + 1}, style);
          var clear = operation(function(){one(); two();});
          if (autoclear) setTimeout(clear, 800);
          else bracketHighlighted = clear;
          break;
        }
      }
    }

    // Finds the line to start with when starting a parse. Tries to
    // find a line with a stateAfter, so that it can start with a
    // valid state. If that fails, it returns the line with the
    // smallest indentation, which tends to need the least context to
    // parse correctly.
    function findStartLine(n) {
      var minindent, minline;
      for (var search = n, lim = n - 40; search > lim; --search) {
        if (search == 0) return 0;
        var line = lines[search-1];
        if (line.stateAfter) return search;
        var indented = line.indentation();
        if (minline == null || minindent > indented) {
          minline = search;
          minindent = indented;
        }
      }
      return minline;
    }
    function getStateBefore(n) {
      var start = findStartLine(n), state = start && lines[start-1].stateAfter;
      if (!state) state = startState(mode);
      else state = copyState(mode, state);
      for (var i = start; i < n; ++i) {
        var line = lines[i];
        line.highlight(mode, state);
        line.stateAfter = copyState(mode, state);
      }
      if (!lines[n].stateAfter) work.push(n);
      return state;
    }
    function highlightWorker() {
      var end = +new Date + options.workTime;
      while (work.length) {
        if (!lines[showingFrom].stateAfter) var task = showingFrom;
        else var task = work.pop();
        if (task >= lines.length) continue;
        var start = findStartLine(task), state = start && lines[start-1].stateAfter;
        if (state) state = copyState(mode, state);
        else state = startState(mode);

        for (var i = start, l = lines.length; i < l; ++i) {
          var line = lines[i], hadState = line.stateAfter;
          if (+new Date > end) {
            work.push(i);
            startWorker(options.workDelay);
            changes.push({from: task, to: i});
            return;
          }
          var changed = line.highlight(mode, state);
          line.stateAfter = copyState(mode, state);
          if (hadState && !changed && line.text) break;
        }
        changes.push({from: task, to: i});
      }
    }
    function startWorker(time) {
      if (!work.length) return;
      highlight.set(time, operation(highlightWorker));
    }

    // Operations are used to wrap changes in such a way that each
    // change won't have to update the cursor and display (which would
    // be awkward, slow, and error-prone), but instead updates are
    // batched and then all combined and executed at once.
    function startOperation() {
      updateInput = null; changes = []; textChanged = selectionChanged = false;
    }
    function endOperation() {
      var reScroll = false;
      if (selectionChanged) reScroll = !scrollCursorIntoView();
      if (changes.length) updateDisplay(changes);
      else if (selectionChanged) updateCursor();
      if (reScroll) scrollCursorIntoView();
      if (selectionChanged) restartBlink();

      // updateInput can be set to a boolean value to force/prevent an
      // update.
      if (!leaveInputAlone && (updateInput === true || (updateInput !== false && selectionChanged)))
        prepareInput();

      if (selectionChanged && options.onCursorActivity)
        options.onCursorActivity(instance);
      if (textChanged && options.onChange)
        options.onChange(instance);
      if (selectionChanged && options.matchBrackets)
        setTimeout(operation(function() {
          if (bracketHighlighted) {bracketHighlighted(); bracketHighlighted = null;}
          matchBrackets(false);
        }), 20);
    }
    var nestedOperation = 0;
    function operation(f) {
      return function() {
        if (!nestedOperation++) startOperation();
        try {var result = f.apply(this, arguments);}
        finally {if (!--nestedOperation) endOperation();}
        return result;
      };
    }

    function SearchCursor(query, pos, caseFold) {
      this.atOccurrence = false;
      if (caseFold == null) caseFold = typeof query == "string" && query == query.toLowerCase();

      if (pos && typeof pos == "object") pos = clipPos(pos);
      else pos = {line: 0, ch: 0};
      this.pos = {from: pos, to: pos};

      // The matches method is filled in based on the type of query.
      // It takes a position and a direction, and returns an object
      // describing the next occurrence of the query, or null if no
      // more matches were found.
      if (typeof query != "string") // Regexp match
        this.matches = function(reverse, pos) {
          if (reverse) {
            var line = lines[pos.line].text.slice(0, pos.ch), match = line.match(query), start = 0;
            while (match) {
              var ind = line.indexOf(match[0]);
              start += ind;
              line = line.slice(ind + 1);
              var newmatch = line.match(query);
              if (newmatch) match = newmatch;
              else break;
            }
          }
          else {
            var line = lines[pos.line].text.slice(pos.ch), match = line.match(query),
                start = match && pos.ch + line.indexOf(match[0]);
          }
          if (match)
            return {from: {line: pos.line, ch: start},
                    to: {line: pos.line, ch: start + match[0].length},
                    match: match};
        };
      else { // String query
        if (caseFold) query = query.toLowerCase();
        var fold = caseFold ? function(str){return str.toLowerCase();} : function(str){return str;};
        var target = query.split("\n");
        // Different methods for single-line and multi-line queries
        if (target.length == 1)
          this.matches = function(reverse, pos) {
            var line = fold(lines[pos.line].text), len = query.length, match;
            if (reverse ? (pos.ch >= len && (match = line.lastIndexOf(query, pos.ch - len)) != -1)
                        : (match = line.indexOf(query, pos.ch)) != -1)
              return {from: {line: pos.line, ch: match},
                      to: {line: pos.line, ch: match + len}};
          };
        else
          this.matches = function(reverse, pos) {
            var ln = pos.line, idx = (reverse ? target.length - 1 : 0), match = target[idx], line = fold(lines[ln].text);
            var offsetA = (reverse ? line.indexOf(match) + match.length : line.lastIndexOf(match));
            if (reverse ? offsetA >= pos.ch || offsetA != match.length
                        : offsetA <= pos.ch || offsetA != line.length - match.length)
              return;
            for (;;) {
              if (reverse ? !ln : ln == lines.length - 1) return;
              line = fold(lines[ln += reverse ? -1 : 1].text);
              match = target[reverse ? --idx : ++idx];
              if (idx > 0 && idx < target.length - 1) {
                if (line != match) return;
                else continue;
              }
              var offsetB = (reverse ? line.lastIndexOf(match) : line.indexOf(match) + match.length);
              if (reverse ? offsetB != line.length - match.length : offsetB != match.length)
                return;
              var start = {line: pos.line, ch: offsetA}, end = {line: ln, ch: offsetB};
              return {from: reverse ? end : start, to: reverse ? start : end};
            }
          };
      }
    }

    SearchCursor.prototype = {
      findNext: function() {return this.find(false);},
      findPrevious: function() {return this.find(true);},

      find: function(reverse) {
        var self = this, pos = clipPos(reverse ? this.pos.from : this.pos.to);
        function savePosAndFail(line) {
          var pos = {line: line, ch: 0};
          self.pos = {from: pos, to: pos};
          self.atOccurrence = false;
          return false;
        }

        for (;;) {
          if (this.pos = this.matches(reverse, pos)) {
            this.atOccurrence = true;
            return this.pos.match || true;
          }
          if (reverse) {
            if (!pos.line) return savePosAndFail(0);
            pos = {line: pos.line-1, ch: lines[pos.line-1].text.length};
          }
          else {
            if (pos.line == lines.length - 1) return savePosAndFail(lines.length);
            pos = {line: pos.line+1, ch: 0};
          }
        }
      },

      from: function() {if (this.atOccurrence) return copyPos(this.pos.from);},
      to: function() {if (this.atOccurrence) return copyPos(this.pos.to);}
    };

    return instance;
  } // (end of function CodeMirror)

  // The default configuration options.
  CodeMirror.defaults = {
    value: "",
    mode: null,
    indentUnit: 2,
    indentWithTabs: false,
    tabMode: "classic",
    enterMode: "indent",
    electricChars: true,
    onKeyEvent: null,
    lineNumbers: false,
    gutter: false,
    firstLineNumber: 1,
    readOnly: false,
    onChange: null,
    onCursorActivity: null,
    onGutterClick: null,
    onFocus: null, onBlur: null, onScroll: null,
    matchBrackets: false,
    workTime: 100,
    workDelay: 200,
    undoDepth: 40,
    tabindex: null
  };

  // Known modes, by name and by MIME
  var modes = {}, mimeModes = {};
  CodeMirror.defineMode = function(name, mode) {
    if (!CodeMirror.defaults.mode && name != "null") CodeMirror.defaults.mode = name;
    modes[name] = mode;
  };
  CodeMirror.defineMIME = function(mime, spec) {
    mimeModes[mime] = spec;
  };
  CodeMirror.getMode = function(options, spec) {
    if (typeof spec == "string" && mimeModes.hasOwnProperty(spec))
      spec = mimeModes[spec];
    if (typeof spec == "string")
      var mname = spec, config = {};
    else
      var mname = spec.name, config = spec;
    var mfactory = modes[mname];
    if (!mfactory) {
      if (window.console) console.warn("No mode " + mname + " found, falling back to plain text.");
      return CodeMirror.getMode(options, "text/plain");
    }
    return mfactory(options, config);
  }
  CodeMirror.listModes = function() {
    var list = [];
    for (var m in modes)
      if (modes.propertyIsEnumerable(m)) list.push(m);
    return list;
  };
  CodeMirror.listMIMEs = function() {
    var list = [];
    for (var m in mimeModes)
      if (mimeModes.propertyIsEnumerable(m)) list.push(m);
    return list;
  };

  CodeMirror.fromTextArea = function(textarea, options) {
    if (!options) options = {};
    options.value = textarea.value;
    if (!options.tabindex && textarea.tabindex)
      options.tabindex = textarea.tabindex;

    function save() {textarea.value = instance.getValue();}
    if (textarea.form) {
      // Deplorable hack to make the submit method do the right thing.
      var rmSubmit = connect(textarea.form, "submit", save, true);
      if (typeof textarea.form.submit == "function") {
        var realSubmit = textarea.form.submit;
        function wrappedSubmit() {
          save();
          textarea.form.submit = realSubmit;
          textarea.form.submit();
          textarea.form.submit = wrappedSubmit;
        }
        textarea.form.submit = wrappedSubmit;
      }
    }

    textarea.style.display = "none";
    var instance = CodeMirror(function(node) {
      textarea.parentNode.insertBefore(node, textarea.nextSibling);
    }, options);
    instance.save = save;
    instance.toTextArea = function() {
      save();
      textarea.parentNode.removeChild(instance.getWrapperElement());
      textarea.style.display = "";
      if (textarea.form) {
        rmSubmit();
        if (typeof textarea.form.submit == "function")
          textarea.form.submit = realSubmit;
      }
    };
    return instance;
  };

  // Utility functions for working with state. Exported because modes
  // sometimes need to do this.
  function copyState(mode, state) {
    if (state === true) return state;
    if (mode.copyState) return mode.copyState(state);
    var nstate = {};
    for (var n in state) {
      var val = state[n];
      if (val instanceof Array) val = val.concat([]);
      nstate[n] = val;
    }
    return nstate;
  }
  CodeMirror.startState = startState;
  function startState(mode, a1, a2) {
    return mode.startState ? mode.startState(a1, a2) : true;
  }
  CodeMirror.copyState = copyState;

  // The character stream used by a mode's parser.
  function StringStream(string) {
    this.pos = this.start = 0;
    this.string = string;
  }
  StringStream.prototype = {
    eol: function() {return this.pos >= this.string.length;},
    sol: function() {return this.pos == 0;},
    peek: function() {return this.string.charAt(this.pos);},
    next: function() {
      if (this.pos < this.string.length)
        return this.string.charAt(this.pos++);
    },
    eat: function(match) {
      var ch = this.string.charAt(this.pos);
      if (typeof match == "string") var ok = ch == match;
      else var ok = ch && (match.test ? match.test(ch) : match(ch));
      if (ok) {++this.pos; return ch;}
    },
    eatWhile: function(match) {
      var start = this.start;
      while (this.eat(match)){}
      return this.pos > start;
    },
    eatSpace: function() {
      var start = this.pos;
      while (/[\s\u00a0]/.test(this.string.charAt(this.pos))) ++this.pos;
      return this.pos > start;
    },
    skipToEnd: function() {this.pos = this.string.length;},
    skipTo: function(ch) {
      var found = this.string.indexOf(ch, this.pos);
      if (found > -1) {this.pos = found; return true;}
    },
    backUp: function(n) {this.pos -= n;},
    column: function() {return countColumn(this.string, this.start);},
    indentation: function() {return countColumn(this.string);},
    match: function(pattern, consume, caseInsensitive) {
      if (typeof pattern == "string") {
        function cased(str) {return caseInsensitive ? str.toLowerCase() : str;}
        if (cased(this.string).indexOf(cased(pattern), this.pos) == this.pos) {
          if (consume !== false) this.pos += pattern.length;
          return true;
        }
      }
      else {
        var match = this.string.slice(this.pos).match(pattern);
        if (match && consume !== false) this.pos += match[0].length;
        return match;
      }
    },
    current: function(){return this.string.slice(this.start, this.pos);}
  };

  // Line objects. These hold state related to a line, including
  // highlighting info (the styles array).
  function Line(text, styles) {
    this.styles = styles || [text, null];
    this.stateAfter = null;
    this.text = text;
    this.marked = this.gutterMarker = this.className = null;
  }
  Line.prototype = {
    // Replace a piece of a line, keeping the styles around it intact.
    replace: function(from, to, text) {
      var st = [], mk = this.marked;
      copyStyles(0, from, this.styles, st);
      if (text) st.push(text, null);
      copyStyles(to, this.text.length, this.styles, st);
      this.styles = st;
      this.text = this.text.slice(0, from) + text + this.text.slice(to);
      this.stateAfter = null;
      if (mk) {
        var diff = text.length - (to - from), end = this.text.length;
        function fix(n) {return n <= Math.min(to, to + diff) ? n : n + diff;}
        for (var i = 0; i < mk.length; ++i) {
          var mark = mk[i], del = false;
          if (mark.from >= end) del = true;
          else {mark.from = fix(mark.from); if (mark.to != null) mark.to = fix(mark.to);}
          if (del || mark.from >= mark.to) {mk.splice(i, 1); i--;}
        }
      }
    },
    // Split a line in two, again keeping styles intact.
    split: function(pos, textBefore) {
      var st = [textBefore, null];
      copyStyles(pos, this.text.length, this.styles, st);
      return new Line(textBefore + this.text.slice(pos), st);
    },
    addMark: function(from, to, style) {
      var mk = this.marked, mark = {from: from, to: to, style: style};
      if (this.marked == null) this.marked = [];
      this.marked.push(mark);
      this.marked.sort(function(a, b){return a.from - b.from;});
      return mark;
    },
    removeMark: function(mark) {
      var mk = this.marked;
      if (!mk) return;
      for (var i = 0; i < mk.length; ++i)
        if (mk[i] == mark) {mk.splice(i, 1); break;}
    },
    // Run the given mode's parser over a line, update the styles
    // array, which contains alternating fragments of text and CSS
    // classes.
    highlight: function(mode, state) {
      var stream = new StringStream(this.text), st = this.styles, pos = 0, changed = false;
      while (!stream.eol()) {
        var style = mode.token(stream, state);
        var substr = this.text.slice(stream.start, stream.pos);
        stream.start = stream.pos;
        if (pos && st[pos-1] == style)
          st[pos-2] += substr;
        else if (substr) {
          if (!changed && st[pos] != substr || st[pos+1] != style) changed = true;
          st[pos++] = substr; st[pos++] = style;
        }
        // Give up when line is ridiculously long
        if (stream.pos > 5000) {
          st[pos++] = this.text.slice(stream.pos); st[pos++] = null;
          break;
        }
      }
      if (st.length != pos) {st.length = pos; changed = true;}
      return changed;
    },
    // Fetch the parser token for a given character. Useful for hacks
    // that want to inspect the mode state (say, for completion).
    getTokenAt: function(mode, state, ch) {
      var txt = this.text, stream = new StringStream(txt);
      while (stream.pos < ch && !stream.eol()) {
        stream.start = stream.pos;
        var style = mode.token(stream, state);
      }
      return {start: stream.start,
              end: stream.pos,
              string: stream.current(),
              className: style || null,
              state: state};
    },
    indentation: function() {return countColumn(this.text);},
    // Produces an HTML fragment for the line, taking selection,
    // marking, and highlighting into account.
    getHTML: function(sfrom, sto, includePre) {
      var html = [];
      if (includePre)
        html.push(this.className ? '<pre class="' + this.className + '">': "<pre>");
      function span(text, style) {
        if (!text) return;
        if (style) html.push('<span class="', style, '">', htmlEscape(text), "</span>");
        else html.push(htmlEscape(text));
      }
      var st = this.styles, allText = this.text, marked = this.marked;
      if (sfrom == sto) sfrom = null;

      if (!allText)
        span(" ", sfrom != null && sto == null ? "CodeMirror-selected" : null);
      else if (!marked && sfrom == null)
        for (var i = 0, e = st.length; i < e; i+=2) span(st[i], st[i+1]);
      else {
        var pos = 0, i = 0, text = "", style, sg = 0;
        var markpos = -1, mark = null;
        function nextMark() {
          if (marked) {
            markpos += 1;
            mark = (markpos < marked.length) ? marked[markpos] : null;
          }
        }
        nextMark();        
        while (pos < allText.length) {
          var upto = allText.length;
          var extraStyle = "";
          if (sfrom != null) {
            if (sfrom > pos) upto = sfrom;
            else if (sto == null || sto > pos) {
              extraStyle = " CodeMirror-selected";
              if (sto != null) upto = Math.min(upto, sto);
            }
          }
          while (mark && mark.to != null && mark.to <= pos) nextMark();
          if (mark) {
            if (mark.from > pos) upto = Math.min(upto, mark.from);
            else {
              extraStyle += " " + mark.style;
              if (mark.to != null) upto = Math.min(upto, mark.to);
            }
          }
          for (;;) {
            var end = pos + text.length;
            var apliedStyle = style;
            if (extraStyle) apliedStyle = style ? style + extraStyle : extraStyle;
            span(end > upto ? text.slice(0, upto - pos) : text, apliedStyle);
            if (end >= upto) {text = text.slice(upto - pos); pos = upto; break;}
            pos = end;
            text = st[i++]; style = st[i++];
          }
        }
        if (sfrom != null && sto == null) span(" ", "CodeMirror-selected");
      }
      if (includePre) html.push("</pre>");
      return html.join("");
    }
  };
  // Utility used by replace and split above
  function copyStyles(from, to, source, dest) {
    for (var i = 0, pos = 0, state = 0; pos < to; i+=2) {
      var part = source[i], end = pos + part.length;
      if (state == 0) {
        if (end > from) dest.push(part.slice(from - pos, Math.min(part.length, to - pos)), source[i+1]);
        if (end >= from) state = 1;
      }
      else if (state == 1) {
        if (end > to) dest.push(part.slice(0, to - pos), source[i+1]);
        else dest.push(part, source[i+1]);
      }
      pos = end;
    }
  }

  // The history object 'chunks' changes that are made close together
  // and at almost the same time into bigger undoable units.
  function History() {
    this.time = 0;
    this.done = []; this.undone = [];
  }
  History.prototype = {
    addChange: function(start, added, old) {
      this.undone.length = 0;
      var time = +new Date, last = this.done[this.done.length - 1];
      if (time - this.time > 400 || !last ||
          last.start > start + added || last.start + last.added < start - last.added + last.old.length)
        this.done.push({start: start, added: added, old: old});
      else {
        var oldoff = 0;
        if (start < last.start) {
          for (var i = last.start - start - 1; i >= 0; --i)
            last.old.unshift(old[i]);
          last.added += last.start - start;
          last.start = start;
        }
        else if (last.start < start) {
          oldoff = start - last.start;
          added += oldoff;
        }
        for (var i = last.added - oldoff, e = old.length; i < e; ++i)
          last.old.push(old[i]);
        if (last.added < added) last.added = added;
      }
      this.time = time;
    }
  };

  // Event stopping compatibility wrapper.
  function stopEvent() {
    if (this.preventDefault) {this.preventDefault(); this.stopPropagation();}
    else {this.returnValue = false; this.cancelBubble = true;}
  }
  // Ensure an event has a stop method.
  function addStop(event) {
    if (!event.stop) event.stop = stopEvent;
    return event;
  }

  // Event wrapper, exposing the few operations we need.
  function Event(orig) {this.e = orig;}
  Event.prototype = {
    stop: function() {stopEvent.call(this.e);},
    target: function() {return this.e.target || this.e.srcElement;},
    button: function() {
      if (this.e.which) return this.e.which;
      else if (this.e.button & 1) return 1;
      else if (this.e.button & 2) return 3;
      else if (this.e.button & 4) return 2;
    },
    pageX: function() {
      if (this.e.pageX != null) return this.e.pageX;
      else return this.e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
    },
    pageY: function() {
      if (this.e.pageY != null) return this.e.pageY;
      else return this.e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }
  };

  // Event handler registration. If disconnect is true, it'll return a
  // function that unregisters the handler.
  function connect(node, type, handler, disconnect) {
    function wrapHandler(event) {handler(new Event(event || window.event));}
    if (typeof node.addEventListener == "function") {
      node.addEventListener(type, wrapHandler, false);
      if (disconnect) return function() {node.removeEventListener(type, wrapHandler, false);};
    }
    else {
      node.attachEvent("on" + type, wrapHandler);
      if (disconnect) return function() {node.detachEvent("on" + type, wrapHandler);};
    }
  }

  function Delayed() {this.id = null;}
  Delayed.prototype = {set: function(ms, f) {clearTimeout(this.id); this.id = setTimeout(f, ms);}};

  // Some IE versions don't preserve whitespace when setting the
  // innerHTML of a PRE tag.
  var badInnerHTML = (function() {
    var pre = document.createElement("pre");
    pre.innerHTML = " "; return !pre.innerHTML;
  })();

  var gecko = /gecko\/\d{7}/i.test(navigator.userAgent);

  var lineSep = "\n";
  // Feature-detect whether newlines in textareas are converted to \r\n
  (function () {
    var te = document.createElement("textarea");
    te.value = "foo\nbar";
    if (te.value.indexOf("\r") > -1) lineSep = "\r\n";
  }());

  var tabSize = 8;
  var mac = /Mac/.test(navigator.platform);
  var movementKeys = {};
  for (var i = 35; i <= 40; ++i)
    movementKeys[i] = movementKeys["c" + i] = true;

  // Counts the column offset in a string, taking tabs into account.
  // Used mostly to find indentation.
  function countColumn(string, end) {
    if (end == null) {
      end = string.search(/[^\s\u00a0]/);
      if (end == -1) end = string.length;
    }
    for (var i = 0, n = 0; i < end; ++i) {
      if (string.charAt(i) == "\t") n += tabSize - (n % tabSize);
      else ++n;
    }
    return n;
  }

  // Find the position of an element by following the offsetParent chain.
  function eltOffset(node) {
    var x = 0, y = 0, n2 = node;
    for (var n = node; n; n = n.offsetParent) {x += n.offsetLeft; y += n.offsetTop;}
    for (var n = node; n != document.body; n = n.parentNode) {x -= n.scrollLeft; y -= n.scrollTop;}
    return {left: x, top: y};
  }
  // Get a node's text content.
  function eltText(node) {
    return node.textContent || node.innerText || node.nodeValue || "";
  }

  // Operations on {line, ch} objects.
  function posEq(a, b) {return a.line == b.line && a.ch == b.ch;}
  function posLess(a, b) {return a.line < b.line || (a.line == b.line && a.ch < b.ch);}
  function copyPos(x) {return {line: x.line, ch: x.ch};}

  function htmlEscape(str) {
    return str.replace(/[<&]/g, function(str) {return str == "&" ? "&amp;" : "&lt;";});
  }

  // Used to position the cursor after an undo/redo by finding the
  // last edited character.
  function editEnd(from, to) {
    if (!to) return from ? from.length : 0;
    if (!from) return to.length;
    for (var i = from.length, j = to.length; i >= 0 && j >= 0; --i, --j)
      if (from.charAt(i) != to.charAt(j)) break;
    return j + 1;
  }

  function indexOf(collection, elt) {
    if (collection.indexOf) return collection.indexOf(elt);
    for (var i = 0, e = collection.length; i < e; ++i)
      if (collection[i] == elt) return i;
    return -1;
  }

  // See if "".split is the broken IE version, if so, provide an
  // alternative way to split lines.
  if ("\n\nb".split(/\n/).length != 3)
    var splitLines = function(string) {
      var pos = 0, nl, result = [];
      while ((nl = string.indexOf("\n", pos)) > -1) {
        result.push(string.slice(pos, string.charAt(nl-1) == "\r" ? nl - 1 : nl));
        pos = nl + 1;
      }
      result.push(string.slice(pos));
      return result;
    };
  else
    var splitLines = function(string){return string.split(/\r?\n/);};

  // Sane model of finding and setting the selection in a textarea
  if (window.getSelection) {
    var selRange = function(te) {
      try {return {start: te.selectionStart, end: te.selectionEnd};}
      catch(e) {return null;}
    };
    var setSelRange = function(te, start, end) {
      try {te.setSelectionRange(start, end);}
      catch(e) {} // Fails on Firefox when textarea isn't part of the document
    };
  }
  // IE model. Don't ask.
  else {
    var selRange = function(te) {
      try {var range = document.selection.createRange();}
      catch(e) {return null;}
      if (!range || range.parentElement() != te) return null;
      var val = te.value, len = val.length, localRange = te.createTextRange();
      localRange.moveToBookmark(range.getBookmark());
      var endRange = te.createTextRange();
      endRange.collapse(false);

      if (localRange.compareEndPoints("StartToEnd", endRange) > -1)
        return {start: len, end: len};

      var start = -localRange.moveStart("character", -len);
      for (var i = val.indexOf("\r"); i > -1 && i < start; i = val.indexOf("\r", i+1), start++) {}

      if (localRange.compareEndPoints("EndToEnd", endRange) > -1)
        return {start: start, end: len};

      var end = -localRange.moveEnd("character", -len);
      for (var i = val.indexOf("\r"); i > -1 && i < end; i = val.indexOf("\r", i+1), end++) {}
      return {start: start, end: end};
    };
    var setSelRange = function(te, start, end) {
      var range = te.createTextRange();
      range.collapse(true);
      var endrange = range.duplicate();
      var newlines = 0, txt = te.value;
      for (var pos = txt.indexOf("\n"); pos > -1 && pos < start; pos = txt.indexOf("\n", pos + 1))
        ++newlines;
      range.move("character", start - newlines);
      for (; pos > -1 && pos < end; pos = txt.indexOf("\n", pos + 1))
        ++newlines;
      endrange.move("character", end - newlines);
      range.setEndPoint("EndToEnd", endrange);
      range.select();
    };
  }

  CodeMirror.defineMode("null", function() {
    return {token: function(stream) {stream.skipToEnd();}};
  });
  CodeMirror.defineMIME("text/plain", "null");

  return CodeMirror;
})();
// tipsy, facebook style tooltips for jquery
// version 1.0.0a
// (c) 2008-2010 jason frame [jason@onehackoranother.com]
// releated under the MIT license

(function($) {
    
    function fixTitle($ele) {
        if ($ele.attr('title') || typeof($ele.attr('original-title')) != 'string') {
            $ele.attr('original-title', $ele.attr('title') || '').removeAttr('title');
        }
    }
    
    function Tipsy(element, options) {
        this.$element = $(element);
        this.options = options;
        this.enabled = true;
        fixTitle(this.$element);
    }
    
    Tipsy.prototype = {
        show: function() {
            var title = this.getTitle();
            if (title && this.enabled) {
                var $tip = this.tip();
                
                $tip.find('.tipsy-inner')[this.options.html ? 'html' : 'text'](title);
                $tip[0].className = 'tipsy'; // reset classname in case of dynamic gravity
                $tip.remove().css({top: 0, left: 0, visibility: 'hidden', display: 'block'}).appendTo(document.body);
                
                var pos = $.extend({}, this.$element.offset(), {
                    width: this.$element[0].offsetWidth,
                    height: this.$element[0].offsetHeight
                });
                
                var actualWidth = $tip[0].offsetWidth, actualHeight = $tip[0].offsetHeight;
                var gravity = (typeof this.options.gravity == 'function')
                                ? this.options.gravity.call(this.$element[0])
                                : this.options.gravity;
                
                var tp;
                switch (gravity.charAt(0)) {
                    case 'n':
                        tp = {top: pos.top + pos.height + this.options.offset, left: pos.left + pos.width / 2 - actualWidth / 2};
                        break;
                    case 's':
                        tp = {top: pos.top - actualHeight - this.options.offset, left: pos.left + pos.width / 2 - actualWidth / 2};
                        break;
                    case 'e':
                        tp = {top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left - actualWidth - this.options.offset};
                        break;
                    case 'w':
                        tp = {top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left + pos.width + this.options.offset};
                        break;
                }
                
                if (gravity.length == 2) {
                    if (gravity.charAt(1) == 'w') {
                        tp.left = pos.left + pos.width / 2 - 15;
                    } else {
                        tp.left = pos.left + pos.width / 2 - actualWidth + 15;
                    }
                }
                
                $tip.css(tp).addClass('tipsy-' + gravity);
                
                if (this.options.fade) {
                    $tip.stop().css({opacity: 0, display: 'block', visibility: 'visible'}).animate({opacity: this.options.opacity});
                } else {
                    $tip.css({visibility: 'visible', opacity: this.options.opacity});
                }
            }
        },
        
        hide: function() {
            if (this.options.fade) {
                this.tip().stop().fadeOut(function() { $(this).remove(); });
            } else {
                this.tip().remove();
            }
        },
        
        getTitle: function() {
            var title, $e = this.$element, o = this.options;
            fixTitle($e);
            var title, o = this.options;
            if (typeof o.title == 'string') {
                title = $e.attr(o.title == 'title' ? 'original-title' : o.title);
            } else if (typeof o.title == 'function') {
                title = o.title.call($e[0]);
            }
            title = ('' + title).replace(/(^\s*|\s*$)/, "");
            return title || o.fallback;
        },
        
        tip: function() {
            if (!this.$tip) {
                this.$tip = $('<div class="tipsy"></div>').html('<div class="tipsy-arrow"></div><div class="tipsy-inner"/></div>');
            }
            return this.$tip;
        },
        
        validate: function() {
            if (!this.$element[0].parentNode) this.hide();
        },
        
        enable: function() { this.enabled = true; },
        disable: function() { this.enabled = false; },
        toggleEnabled: function() { this.enabled = !this.enabled; }
    };
    
    $.fn.tipsy = function(options) {
        
        if (options === true) {
            return this.data('tipsy');
        } else if (typeof options == 'string') {
            return this.data('tipsy')[options]();
        }
        
        options = $.extend({}, $.fn.tipsy.defaults, options);
        
        function get(ele) {
            var tipsy = $.data(ele, 'tipsy');
            if (!tipsy) {
                tipsy = new Tipsy(ele, $.fn.tipsy.elementOptions(ele, options));
                $.data(ele, 'tipsy', tipsy);
            }
            return tipsy;
        }
        
        function enter() {
            var tipsy = get(this);
            tipsy.hoverState = 'in';
            if (options.delayIn == 0) {
                tipsy.show();
            } else {
                setTimeout(function() { if (tipsy.hoverState == 'in') tipsy.show(); }, options.delayIn);
            }
        };
        
        function leave() {
            var tipsy = get(this);
            tipsy.hoverState = 'out';
            if (options.delayOut == 0) {
                tipsy.hide();
            } else {
                setTimeout(function() { if (tipsy.hoverState == 'out') tipsy.hide(); }, options.delayOut);
            }
        };
        
        if (!options.live) this.each(function() { get(this); });
        
        if (options.trigger != 'manual') {
            var binder   = options.live ? 'live' : 'bind',
                eventIn  = options.trigger == 'hover' ? 'mouseenter' : 'focus',
                eventOut = options.trigger == 'hover' ? 'mouseleave' : 'blur';
            this[binder](eventIn, enter)[binder](eventOut, leave);
        }
        
        return this;
        
    };
    
    $.fn.tipsy.defaults = {
        delayIn: 0,
        delayOut: 0,
        fade: false,
        fallback: '',
        gravity: 'n',
        html: false,
        live: false,
        offset: 0,
        opacity: 0.8,
        title: 'title',
        trigger: 'hover'
    };
    
    // Overwrite this method to provide options on a per-element basis.
    // For example, you could store the gravity in a 'tipsy-gravity' attribute:
    // return $.extend({}, options, {gravity: $(ele).attr('tipsy-gravity') || 'n' });
    // (remember - do not modify 'options' in place!)
    $.fn.tipsy.elementOptions = function(ele, options) {
        return $.metadata ? $.extend({}, options, $(ele).metadata()) : options;
    };
    
    $.fn.tipsy.autoNS = function() {
        return $(this).offset().top > ($(document).scrollTop() + $(window).height() / 2) ? 's' : 'n';
    };
    
    $.fn.tipsy.autoWE = function() {
        return $(this).offset().left > ($(document).scrollLeft() + $(window).width() / 2) ? 'e' : 'w';
    };
    
})(jQuery);
/*
 * Modest Maps JS v0.16.1
 * http://modestmaps.com/
 *
 * Copyright (c) 2010 Stamen Design, All Rights Reserved.
 *
 * Open source under the BSD License.
 * http://creativecommons.org/licenses/BSD/
 *
 * Versioned using Semantic Versioning (v.major.minor.patch)
 * See CHANGELOG and http://semver.org/ for more details.
 * 
 */
if(!com){var com={};if(!com.modestmaps){com.modestmaps={}}}(function(a){a.extend=function(d,b){for(var c in b.prototype){if(typeof d.prototype[c]=="undefined"){d.prototype[c]=b.prototype[c]}}return d};a.cancelEvent=function(b){b.cancelBubble=true;b.cancel=true;b.returnValue=false;if(b.stopPropagation){b.stopPropagation()}if(b.preventDefault){b.preventDefault()}return false};a.addEvent=function(d,c,b){if(d.attachEvent){d["e"+c+b]=b;d[c+b]=function(){d["e"+c+b](window.event)};d.attachEvent("on"+c,d[c+b])}else{d.addEventListener(c,b,false);if(c=="mousewheel"){d.addEventListener("DOMMouseScroll",b,false)}}};a.removeEvent=function(d,c,b){if(d.detachEvent){d.detachEvent("on"+c,d[c+b]);d[c+b]=null}else{d.removeEventListener(c,b,false);if(c=="mousewheel"){d.removeEventListener("DOMMouseScroll",b,false)}}};a.getStyle=function(c,b){if(c.currentStyle){var d=c.currentStyle[b]}else{if(window.getComputedStyle){var d=document.defaultView.getComputedStyle(c,null).getPropertyValue(b)}}return d};a.Point=function(b,c){this.x=parseFloat(b);this.y=parseFloat(c)};a.Point.prototype={x:0,y:0,toString:function(){return"("+this.x.toFixed(3)+", "+this.y.toFixed(3)+")"}};a.Point.distance=function(e,d){var c=(d.x-e.x);var b=(d.y-e.y);return Math.sqrt(c*c+b*b)};a.Point.interpolate=function(f,e,d){var c=f.x+(e.x-f.x)*d;var b=f.y+(e.y-f.y)*d;return new a.Point(c,b)};a.Coordinate=function(d,b,c){this.row=d;this.column=b;this.zoom=c};a.Coordinate.prototype={row:0,column:0,zoom:0,toString:function(){return"("+this.row.toFixed(3)+", "+this.column.toFixed(3)+" @"+this.zoom.toFixed(3)+")"},toKey:function(){return[Math.floor(this.zoom),Math.floor(this.column),Math.floor(this.row)].join(",")},copy:function(){return new a.Coordinate(this.row,this.column,this.zoom)},container:function(){return new a.Coordinate(Math.floor(this.row),Math.floor(this.column),Math.floor(this.zoom))},zoomTo:function(b){var c=Math.pow(2,b-this.zoom);return new a.Coordinate(this.row*c,this.column*c,b)},zoomBy:function(c){var b=Math.pow(2,c);return new a.Coordinate(this.row*b,this.column*b,this.zoom+c)},up:function(b){if(b===undefined){b=1}return new a.Coordinate(this.row-b,this.column,this.zoom)},right:function(b){if(b===undefined){b=1}return new a.Coordinate(this.row,this.column+b,this.zoom)},down:function(b){if(b===undefined){b=1}return new a.Coordinate(this.row+b,this.column,this.zoom)},left:function(b){if(b===undefined){b=1}return new a.Coordinate(this.row,this.column-b,this.zoom)}};a.Location=function(b,c){this.lat=parseFloat(b);this.lon=parseFloat(c)};a.Location.prototype={lat:0,lon:0,toString:function(){return"("+this.lat.toFixed(3)+", "+this.lon.toFixed(3)+")"}};a.Location.distance=function(i,h,b){if(!b){b=6378000}var o=Math.PI/180,g=i.lat*o,n=i.lon*o,f=h.lat*o,m=h.lon*o,l=Math.cos(g)*Math.cos(n)*Math.cos(f)*Math.cos(m),k=Math.cos(g)*Math.sin(n)*Math.cos(f)*Math.sin(m),j=Math.sin(g)*Math.sin(f);return Math.acos(l+k+j)*b};a.Location.interpolate=function(i,g,m){var s=Math.PI/180,k=i.lat*s,n=i.lon*s,j=g.lat*s,l=g.lon*s;var o=2*Math.asin(Math.sqrt(Math.pow(Math.sin((k-j)/2),2)+Math.cos(k)*Math.cos(j)*Math.pow(Math.sin((n-l)/2),2)));var t=Math.atan2(Math.sin(n-l)*Math.cos(j),Math.cos(k)*Math.sin(j)-Math.sin(k)*Math.cos(j)*Math.cos(n-l))/-(Math.PI/180);t=t<0?360+t:t;var e=Math.sin((1-m)*o)/Math.sin(o);var b=Math.sin(m*o)/Math.sin(o);var r=e*Math.cos(k)*Math.cos(n)+b*Math.cos(j)*Math.cos(l);var q=e*Math.cos(k)*Math.sin(n)+b*Math.cos(j)*Math.sin(l);var p=e*Math.sin(k)+b*Math.sin(j);var c=Math.atan2(p,Math.sqrt(Math.pow(r,2)+Math.pow(q,2)));var h=Math.atan2(q,r);return new a.Location(c/s,h/s)};a.Transformation=function(d,f,b,c,e,g){this.ax=d;this.bx=f;this.cx=b;this.ay=c;this.by=e;this.cy=g};a.Transformation.prototype={ax:0,bx:0,cx:0,ay:0,by:0,cy:0,transform:function(b){return new a.Point(this.ax*b.x+this.bx*b.y+this.cx,this.ay*b.x+this.by*b.y+this.cy)},untransform:function(b){return new a.Point((b.x*this.by-b.y*this.bx-this.cx*this.by+this.cy*this.bx)/(this.ax*this.by-this.ay*this.bx),(b.x*this.ay-b.y*this.ax-this.cx*this.ay+this.cy*this.ax)/(this.bx*this.ay-this.by*this.ax))}};a.deriveTransformation=function(l,k,f,e,b,o,h,g,d,c,n,m){var j=a.linearSolution(l,k,f,b,o,h,d,c,n);var i=a.linearSolution(l,k,e,b,o,g,d,c,m);return new a.Transformation(j[0],j[1],j[2],i[0],i[1],i[2])};a.linearSolution=function(f,o,i,e,n,h,d,m,g){f=parseFloat(f);o=parseFloat(o);i=parseFloat(i);e=parseFloat(e);n=parseFloat(n);h=parseFloat(h);d=parseFloat(d);m=parseFloat(m);g=parseFloat(g);var l=(((h-g)*(o-n))-((i-h)*(n-m)))/(((e-d)*(o-n))-((f-e)*(n-m)));var k=(((h-g)*(f-e))-((i-h)*(e-d)))/(((n-m)*(f-e))-((o-n)*(e-d)));var j=i-(f*l)-(o*k);return[l,k,j]};a.Projection=function(c,b){if(!b){b=new a.Transformation(1,0,0,0,1,0)}this.zoom=c;this.transformation=b};a.Projection.prototype={zoom:0,transformation:null,rawProject:function(b){throw"Abstract method not implemented by subclass."},rawUnproject:function(b){throw"Abstract method not implemented by subclass."},project:function(b){b=this.rawProject(b);if(this.transformation){b=this.transformation.transform(b)}return b},unproject:function(b){if(this.transformation){b=this.transformation.untransform(b)}b=this.rawUnproject(b);return b},locationCoordinate:function(c){var b=new a.Point(Math.PI*c.lon/180,Math.PI*c.lat/180);b=this.project(b);return new a.Coordinate(b.y,b.x,this.zoom)},coordinateLocation:function(c){c=c.zoomTo(this.zoom);var b=new a.Point(c.column,c.row);b=this.unproject(b);return new a.Location(180*b.y/Math.PI,180*b.x/Math.PI)}};a.LinearProjection=function(c,b){a.Projection.call(this,c,b)};a.LinearProjection.prototype={rawProject:function(b){return new a.Point(b.x,b.y)},rawUnproject:function(b){return new a.Point(b.x,b.y)}};a.extend(a.LinearProjection,a.Projection);a.MercatorProjection=function(c,b){a.Projection.call(this,c,b)};a.MercatorProjection.prototype={rawProject:function(b){return new a.Point(b.x,Math.log(Math.tan(0.25*Math.PI+0.5*b.y)))},rawUnproject:function(b){return new a.Point(b.x,2*Math.atan(Math.pow(Math.E,b.y))-0.5*Math.PI)}};a.extend(a.MercatorProjection,a.Projection);a.MapProvider=function(b){if(b){this.getTileUrl=b}};a.MapProvider.prototype={projection:new a.MercatorProjection(0,a.deriveTransformation(-Math.PI,Math.PI,0,0,Math.PI,Math.PI,1,0,-Math.PI,-Math.PI,0,1)),tileWidth:256,tileHeight:256,topLeftOuterLimit:new a.Coordinate(0,0,0),bottomRightInnerLimit:new a.Coordinate(1,1,0).zoomTo(18),getTileUrl:function(b){throw"Abstract method not implemented by subclass."},locationCoordinate:function(b){return this.projection.locationCoordinate(b)},coordinateLocation:function(b){return this.projection.coordinateLocation(b)},outerLimits:function(){return[this.topLeftOuterLimit.copy(),this.bottomRightInnerLimit.copy()]},setZoomRange:function(c,b){this.topLeftOuterLimit=this.topLeftOuterLimit.zoomTo(c);this.bottomRightInnerLimit=this.bottomRightInnerLimit.zoomTo(b)},sourceCoordinate:function(g){var b=this.topLeftOuterLimit.zoomTo(g.zoom);var d=this.bottomRightInnerLimit.zoomTo(g.zoom);var c=d.row-b.row;if(g.row<0|g.row>=c){return null}var f=d.column-b.column;var e=g.column%f;while(e<0){e+=f}return new a.Coordinate(g.row,e,g.zoom)}};a.TemplatedMapProvider=function(c,b){a.MapProvider.call(this,function(f){f=this.sourceCoordinate(f);if(!f){return null}var d=c;if(b&&b.length&&d.indexOf("{S}")>=0){var e=parseInt(f.zoom+f.row+f.column,10)%b.length;d=d.replace("{S}",b[e])}return d.replace("{Z}",f.zoom.toFixed(0)).replace("{X}",f.column.toFixed(0)).replace("{Y}",f.row.toFixed(0))})};a.extend(a.TemplatedMapProvider,a.MapProvider);a.MouseHandler=function(b){if(b!==undefined){this.init(b)}};a.MouseHandler.prototype={init:function(b){this.map=b;a.addEvent(b.parent,"dblclick",this.getDoubleClick());a.addEvent(b.parent,"mousedown",this.getMouseDown());a.addEvent(b.parent,"mousewheel",this.getMouseWheel())},mouseDownHandler:null,getMouseDown:function(){if(!this.mouseDownHandler){var b=this;this.mouseDownHandler=function(c){a.addEvent(document,"mouseup",b.getMouseUp());a.addEvent(document,"mousemove",b.getMouseMove());b.prevMouse=new a.Point(c.clientX,c.clientY);b.map.parent.style.cursor="move";return a.cancelEvent(c)}}return this.mouseDownHandler},mouseMoveHandler:null,getMouseMove:function(){if(!this.mouseMoveHandler){var b=this;this.mouseMoveHandler=function(c){if(b.prevMouse){b.map.panBy(c.clientX-b.prevMouse.x,c.clientY-b.prevMouse.y);b.prevMouse.x=c.clientX;b.prevMouse.y=c.clientY}return a.cancelEvent(c)}}return this.mouseMoveHandler},mouseUpHandler:null,getMouseUp:function(){if(!this.mouseUpHandler){var b=this;this.mouseUpHandler=function(c){a.removeEvent(document,"mouseup",b.getMouseUp());a.removeEvent(document,"mousemove",b.getMouseMove());b.prevMouse=null;b.map.parent.style.cursor="";return a.cancelEvent(c)}}return this.mouseUpHandler},mouseWheelHandler:null,getMouseWheel:function(){if(!this.mouseWheelHandler){var c=this;var b=new Date().getTime();this.mouseWheelHandler=function(g){var h=0;if(g.wheelDelta){h=g.wheelDelta}else{if(g.detail){h=-g.detail}}var f=new Date().getTime()-b;if(Math.abs(h)>0&&(f>200)){var d=c.getMousePoint(g);c.map.zoomByAbout(h>0?1:-1,d);b=new Date().getTime()}return a.cancelEvent(g)}}return this.mouseWheelHandler},doubleClickHandler:null,getDoubleClick:function(){if(!this.doubleClickHandler){var b=this;this.doubleClickHandler=function(d){var c=b.getMousePoint(d);b.map.zoomByAbout(d.shiftKey?-1:1,c);return a.cancelEvent(d)}}return this.doubleClickHandler},getMousePoint:function(d){var b=new a.Point(d.clientX,d.clientY);b.x+=document.body.scrollLeft+document.documentElement.scrollLeft;b.y+=document.body.scrollTop+document.documentElement.scrollTop;for(var c=this.map.parent;c;c=c.offsetParent){b.x-=c.offsetLeft;b.y-=c.offsetTop}return b}};a.CallbackManager=function(b,d){this.owner=b;this.callbacks={};for(var c=0;c<d.length;c++){this.callbacks[d[c]]=[]}};a.CallbackManager.prototype={owner:null,callbacks:null,addCallback:function(b,c){if(typeof(c)=="function"&&this.callbacks[b]){this.callbacks[b].push(c)}},removeCallback:function(e,f){if(typeof(f)=="function"&&this.callbacks[e]){var c=this.callbacks[e],b=c.length;for(var d=0;d<b;d++){if(c[d]===f){c.splice(d,1);break}}}},dispatchCallback:function(d,c){if(this.callbacks[d]){for(var b=0;b<this.callbacks[d].length;b+=1){try{this.callbacks[d][b](this.owner,c)}catch(f){}}}}};a.RequestManager=function(b){this.loadingBay=document.createDocumentFragment();this.requestsById={};this.openRequestCount=0;this.maxOpenRequests=4;this.requestQueue=[];this.callbackManager=new a.CallbackManager(this,["requestcomplete"])};a.RequestManager.prototype={loadingBay:null,requestsById:null,requestQueue:null,openRequestCount:null,maxOpenRequests:null,callbackManager:null,addCallback:function(b,c){this.callbackManager.addCallback(b,c)},removeCallback:function(b,c){this.callbackManager.removeCallback(b,c)},dispatchCallback:function(c,b){this.callbackManager.dispatchCallback(c,b)},clear:function(){this.clearExcept({})},clearExcept:function(g){for(var e=0;e<this.requestQueue.length;e++){var f=this.requestQueue[e];if(f&&!(f.key in g)){this.requestQueue[e]=null}}var b=this.loadingBay.childNodes;for(var d=b.length-1;d>=0;d--){var c=b[d];if(!(c.id in g)){this.loadingBay.removeChild(c);this.openRequestCount--;c.src=c.coord=c.onload=c.onerror=null}}for(var h in this.requestsById){if(this.requestsById.hasOwnProperty(h)){if(!(h in g)){var f=this.requestsById[h];delete this.requestsById[h];if(f!==null){f=f.key=f.coord=f.url=null}}}}},hasRequest:function(b){return(b in this.requestsById)},requestTile:function(c,e,b){if(!(c in this.requestsById)){var d={key:c,coord:e.copy(),url:b};this.requestsById[c]=d;if(b){this.requestQueue.push(d)}}},getProcessQueue:function(){if(!this._processQueue){var b=this;this._processQueue=function(){b.processQueue()}}return this._processQueue},processQueue:function(d){if(d&&this.requestQueue.length>8){this.requestQueue.sort(d)}while(this.openRequestCount<this.maxOpenRequests&&this.requestQueue.length>0){var c=this.requestQueue.pop();if(c){this.openRequestCount++;var b=document.createElement("img");b.id=c.key;b.style.position="absolute";b.coord=c.coord;this.loadingBay.appendChild(b);b.onload=b.onerror=this.getLoadComplete();b.src=c.url;c=c.key=c.coord=c.url=null}}},_loadComplete:null,getLoadComplete:function(){if(!this._loadComplete){var b=this;this._loadComplete=function(d){d=d||window.event;var c=d.srcElement||d.target;c.onload=c.onerror=null;b.loadingBay.removeChild(c);b.openRequestCount--;delete b.requestsById[c.id];if(c.complete||(c.readyState&&c.readyState=="complete")){b.dispatchCallback("requestcomplete",c)}else{c.src=null}setTimeout(b.getProcessQueue(),0)}}return this._loadComplete}};a.Map=function(k,j,b,c){if(typeof k=="string"){k=document.getElementById(k)}this.parent=k;this.parent.style.padding="0";this.parent.style.overflow="hidden";var g=a.getStyle(this.parent,"position");if(g!="relative"&&g!="absolute"){this.parent.style.position="relative"}if(!b){var l=this.parent.offsetWidth;var f=this.parent.offsetHeight;if(!l){l=640;this.parent.style.width=l+"px"}if(!f){f=480;this.parent.style.height=f+"px"}b=new a.Point(l,f);var d=this;a.addEvent(window,"resize",function(h){d.dimensions=new a.Point(d.parent.offsetWidth,d.parent.offsetHeight);d.draw();d.dispatchCallback("resized",[d.dimensions])})}else{this.parent.style.width=Math.round(b.x)+"px";this.parent.style.height=Math.round(b.y)+"px"}this.dimensions=b;this.requestManager=new a.RequestManager(this.parent);this.requestManager.addCallback("requestcomplete",this.getTileComplete());this.layers={};this.layerParent=document.createElement("div");this.layerParent.id=this.parent.id+"-layers";this.layerParent.style.cssText="position: absolute; top: 0px; left: 0px; width: 100%; height: 100%; margin: 0; padding: 0; z-index: 0";this.parent.appendChild(this.layerParent);this.coordinate=new a.Coordinate(0.5,0.5,0);this.setProvider(j);this.enablePyramidLoading=false;this.callbackManager=new a.CallbackManager(this,["zoomed","panned","centered","extentset","resized","drawn"]);if(c===undefined){this.eventHandlers=[];this.eventHandlers.push(new a.MouseHandler(this))}else{this.eventHandlers=c;if(c instanceof Array){for(var e=0;e<c.length;e++){c[e].init(this)}}}};a.Map.prototype={parent:null,provider:null,dimensions:null,coordinate:null,tiles:null,layers:null,layerParent:null,requestManager:null,tileCacheSize:null,maxTileCacheSize:null,recentTiles:null,recentTilesById:null,callbackManager:null,eventHandlers:null,toString:function(){return"Map(#"+this.parent.id+")"},addCallback:function(b,c){this.callbackManager.addCallback(b,c)},removeCallback:function(b,c){this.callbackManager.removeCallback(b,c)},dispatchCallback:function(c,b){this.callbackManager.dispatchCallback(c,b)},zoomBy:function(b){this.coordinate=this.coordinate.zoomBy(b);this.draw();this.dispatchCallback("zoomed",b);return this},zoomIn:function(){return this.zoomBy(1)},zoomOut:function(){return this.zoomBy(-1)},setZoom:function(b){return this.zoomBy(b-this.coordinate.zoom)},zoomByAbout:function(c,b){var e=this.pointLocation(b);this.zoomBy(c);var d=this.locationPoint(e);return this.panBy(b.x-d.x,b.y-d.y)},panBy:function(c,b){this.coordinate.column-=c/this.provider.tileWidth;this.coordinate.row-=b/this.provider.tileHeight;this.draw();this.dispatchCallback("panned",[c,b]);return this},panLeft:function(){return this.panBy(100,0)},panRight:function(){return this.panBy(-100,0)},panDown:function(){return this.panBy(0,-100)},panUp:function(){return this.panBy(0,100)},setCenter:function(b){return this.setCenterZoom(b,this.coordinate.zoom)},setCenterZoom:function(b,c){this.coordinate=this.provider.locationCoordinate(b).zoomTo(parseFloat(c)||0);this.draw();this.dispatchCallback("centered",[b,c]);return this},setExtent:function(k){var h,g;for(var f=0;f<k.length;f++){var q=this.provider.locationCoordinate(k[f]);if(h){h.row=Math.min(h.row,q.row);h.column=Math.min(h.column,q.column);h.zoom=Math.min(h.zoom,q.zoom);g.row=Math.max(g.row,q.row);g.column=Math.max(g.column,q.column);g.zoom=Math.max(g.zoom,q.zoom)}else{h=q.copy();g=q.copy()}}var c=this.dimensions.x+1;var r=this.dimensions.y+1;var b=(g.column-h.column)/(c/this.provider.tileWidth);var l=Math.log(b)/Math.log(2);var m=h.zoom-Math.ceil(l);var n=(g.row-h.row)/(r/this.provider.tileHeight);var s=Math.log(n)/Math.log(2);var p=h.zoom-Math.ceil(s);var d=Math.min(m,p);d=Math.min(d,this.provider.outerLimits()[1].zoom);d=Math.max(d,this.provider.outerLimits()[0].zoom);var e=(h.row+g.row)/2;var j=(h.column+g.column)/2;var o=h.zoom;this.coordinate=new a.Coordinate(e,j,o).zoomTo(d);this.draw();this.dispatchCallback("extentset",k);return this},setSize:function(c,b){if(c.hasOwnProperty("x")&&c.hasOwnProperty("y")){this.dimensions=c}else{if(b!==undefined&&!isNaN(b)){this.dimensions=new a.Point(c,b)}}this.parent.style.width=Math.round(this.dimensions.x)+"px";this.parent.style.height=Math.round(this.dimensions.y)+"px";this.draw();this.dispatchCallback("resized",[this.dimensions]);return this},coordinatePoint:function(c){if(c.zoom!=this.coordinate.zoom){c=c.zoomTo(this.coordinate.zoom)}var b=new a.Point(this.dimensions.x/2,this.dimensions.y/2);b.x+=this.provider.tileWidth*(c.column-this.coordinate.column);b.y+=this.provider.tileHeight*(c.row-this.coordinate.row);return b},pointCoordinate:function(b){var c=this.coordinate.copy();c.column+=(b.x-this.dimensions.x/2)/this.provider.tileWidth;c.row+=(b.y-this.dimensions.y/2)/this.provider.tileHeight;return c},locationPoint:function(b){return this.coordinatePoint(this.provider.locationCoordinate(b))},pointLocation:function(b){return this.provider.coordinateLocation(this.pointCoordinate(b))},getExtent:function(){var b=[];b.push(this.pointLocation(new a.Point(0,0)));b.push(this.pointLocation(this.dimensions));return b},getCenter:function(){return this.provider.coordinateLocation(this.coordinate)},getZoom:function(){return this.coordinate.zoom},setProvider:function(d){var e=false;if(this.provider===null){e=true}if(!e){this.requestManager.clear();for(var b in this.layers){if(this.layers.hasOwnProperty(b)){var c=this.layers[b];while(c.firstChild){c.removeChild(c.firstChild)}}}}this.tiles={};this.tileCacheSize=0;this.maxTileCacheSize=64;this.recentTiles=[];this.recentTilesById={};this.provider=d;if(!e){this.draw()}return this},enforceLimits:function(e){e=e.copy();var c=this.provider.outerLimits();if(c){var d=c[0].zoom;var b=c[1].zoom;if(e.zoom<d){e=e.zoomTo(d)}else{if(e.zoom>b){e=e.zoomTo(b)}}}return e},draw:function(){this.coordinate=this.enforceLimits(this.coordinate);var o=Math.round(this.coordinate.zoom);var u=this.pointCoordinate(new a.Point(0,0)).zoomTo(o).container();var s=this.pointCoordinate(this.dimensions).zoomTo(o).container().right().down();var k=0;if(k){u=u.left(k).up(k);s=s.right(k).down(k)}var G={};var l=this.createOrGetLayer(u.zoom);var e=u.copy();for(e.column=u.column;e.column<=s.column;e.column+=1){for(e.row=u.row;e.row<=s.row;e.row+=1){var m=e.toKey();G[m]=true;if(m in this.tiles){var J=this.tiles[m];if(J.parentNode!=l){l.appendChild(J)}}else{if(!this.requestManager.hasRequest(m)){var n=this.provider.getTileUrl(e);this.requestManager.requestTile(m,e,n)}var q=false;var F=e.zoom;for(var r=1;r<=F;r++){var t=e.zoomBy(-r).container();var y=t.toKey();if(this.enablePyramidLoading){G[y]=true;var z=this.createOrGetLayer(t.zoom);if(y in this.tiles){var v=this.tiles[y];if(v.parentNode!=z){z.appendChild(v)}}else{if(!this.requestManager.hasRequest(y)){var n=this.provider.getTileUrl(t);this.requestManager.requestTile(y,t,n)}}}else{if(y in this.tiles){G[y]=true;q=true;break}}}if(!q&&!this.enablePyramidLoading){var h=e.zoomBy(1);G[h.toKey()]=true;h.column+=1;G[h.toKey()]=true;h.row+=1;G[h.toKey()]=true;h.column-=1;G[h.toKey()]=true}}}}for(var K in this.layers){if(this.layers.hasOwnProperty(K)){var d=parseInt(K,10);if(d>=u.zoom-5&&d<u.zoom+2){continue}var I=this.layers[K];I.style.display="none";var E=I.getElementsByTagName("img");for(var w=E.length-1;w>=0;w--){I.removeChild(E[w])}}}var f=new Date().getTime();var A=u.zoom-5;var g=u.zoom+2;for(var x=A;x<g;x++){var I=this.layers[x];if(!I){continue}var H=1;var c=this.coordinate.copy();if(I.childNodes.length>0){I.style.display="block";H=Math.pow(2,this.coordinate.zoom-x);c=c.zoomTo(x)}else{I.style.display="none"}var b=this.provider.tileWidth*H;var p=this.provider.tileHeight*H;var C=new a.Point(this.dimensions.x/2,this.dimensions.y/2);var E=I.getElementsByTagName("img");for(var w=E.length-1;w>=0;w--){var J=E[w];if(!G[J.id]){I.removeChild(J)}else{var D=C.x+(J.coord.column-c.column)*b;var B=C.y+(J.coord.row-c.row)*p;J.style.left=Math.round(D)+"px";J.style.top=Math.round(B)+"px";J.style.width=Math.ceil(b)+"px";J.style.height=Math.ceil(p)+"px";this.recentTilesById[J.id].lastTouchedTime=f}}}this.requestManager.clearExcept(G);this.requestManager.processQueue(this.getCenterDistanceCompare());this.checkCache();this.dispatchCallback("drawn")},_tileComplete:null,getTileComplete:function(){if(!this._tileComplete){var b=this;this._tileComplete=function(g,h){b.tiles[h.id]=h;b.tileCacheSize++;var e={id:h.id,lastTouchedTime:new Date().getTime()};b.recentTilesById[h.id]=e;b.recentTiles.push(e);var f=b.coordinate.zoomTo(h.coord.zoom);var j=Math.pow(2,b.coordinate.zoom-h.coord.zoom);var d=((b.dimensions.x/2)+(h.coord.column-f.column)*b.provider.tileWidth*j);var c=((b.dimensions.y/2)+(h.coord.row-f.row)*b.provider.tileHeight*j);h.style.left=Math.round(d)+"px";h.style.top=Math.round(c)+"px";h.style.width=Math.ceil(b.provider.tileWidth*j)+"px";h.style.height=Math.ceil(b.provider.tileHeight*j)+"px";var i=b.layers[h.coord.zoom];i.appendChild(h);if(Math.round(b.coordinate.zoom)==h.coord.zoom){i.style.display="block"}b.requestRedraw()}}return this._tileComplete},_redrawTimer:undefined,requestRedraw:function(){if(!this._redrawTimer){this._redrawTimer=setTimeout(this.getRedraw(),1000)}},_redraw:null,getRedraw:function(){if(!this._redraw){var b=this;this._redraw=function(){b.draw();b._redrawTimer=0}}return this._redraw},createOrGetLayer:function(c){if(c in this.layers){return this.layers[c]}var b=document.createElement("div");b.id=this.parent.id+"-zoom-"+c;b.style.cssText=this.layerParent.style.cssText;b.style.zIndex=c;this.layerParent.appendChild(b);this.layers[c]=b;return b},checkCache:function(){var f=this.parent.getElementsByTagName("img").length;var d=Math.max(f,this.maxTileCacheSize);if(this.tileCacheSize>d){this.recentTiles.sort(function(h,g){return g.lastTouchedTime<h.lastTouchedTime?-1:g.lastTouchedTime>h.lastTouchedTime?1:0})}while(this.tileCacheSize>d){var c=this.recentTiles.pop();var b=new Date().getTime();delete this.recentTilesById[c.id];var e=this.tiles[c.id];if(e.parentNode){alert("Gah: trying to removing cached tile even though it's still in the DOM")}else{delete this.tiles[c.id];this.tileCacheSize--}}},getCenterDistanceCompare:function(){var b=this.coordinate.zoomTo(Math.round(this.coordinate.zoom));return function(e,d){if(e&&d){var g=e.coord;var f=d.coord;if(g.zoom==f.zoom){var c=Math.abs(b.row-g.row-0.5)+Math.abs(b.column-g.column-0.5);var h=Math.abs(b.row-f.row-0.5)+Math.abs(b.column-f.column-0.5);return c<h?1:c>h?-1:0}else{return g.zoom<f.zoom?1:g.zoom>f.zoom?-1:0}}return e?1:d?-1:0}}}})(com.modestmaps);