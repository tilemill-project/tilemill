// CodeMirror parser for MSS.
if (!Array.isArray) {
    Array.isArray = function(obj) {
        return Object.prototype.toString.call(obj) === '[object Array]' ||
               (obj instanceof Array);
    };
}

var MSSParser = Editor.Parser = (function() {
  var tokenizeMSS = (function() {
    function nextUntilUnescaped(source, end) {
      var escaped = false;
      while (!source.endOfLine()) {
        var next = source.next();
        if (next == end && !escaped)
          return false;
        escaped = !escaped && next == "\\";
      }
      return escaped;
    };
    function normal(source, setState) {
      var ch = source.next();
      if (ch == '@') {
        source.nextWhileMatches(/\w/);
        var word = source.get();
        return {
            style: (colors[word.replace('@', '')]) ?
                'mss-color-variable' :
                'mss-variable',
            content: word
        };
        return 'mss-at';
      }
      else if (ch == '/' && source.equals('*')) {
        setState(inCComment);
        return null;
      }
      else if (ch == '/' && source.equals('/')) {
        nextUntilUnescaped(source, null);
        return 'mss-comment';
      }
      else if (ch == '=') {
        return 'mss-compare';
      }
      else if (source.equals('=') && (ch == '~' || ch == '|')) {
        source.next();
        return 'mss-compare';
      }
      else if (ch == '\"' || ch == "'") {
        setState(inString(ch));
        return null;
      }
      else if (ch == '#') {
        source.nextWhileMatches(/\w/);
        return 'mss-hash';
      }
      else if (ch == '!') {
        source.nextWhileMatches(/[ \t]/);
        source.nextWhileMatches(/\w/);
        return 'mss-important';
      }
      else if (/\d/.test(ch)) {
        source.nextWhileMatches(/[\w.%]/);
        return 'mss-unit';
      }
      /*
      else if (ch == '[') {
        source.nextWhileMatches(/[^\]]/);
        return "mss-filter";
      }
      */
      else if (/[,.+>*\/]/.test(ch)) {
        return 'mss-select-op';
      }
      else if (/[;{}:\[\]]/.test(ch)) {
        return 'mss-punctuation';
      }
      else {
        source.nextWhileMatches(/[\w\\\-_]/);
        var word = source.get();
        if (identifiers[word]) {
          return {
              style: 'mss-valid-identifier',
              content: word
          };
        } else {
          return {
              style: 'mss-identifier',
              content: word
          };
        }
      }
    }

    function inCComment(source, setState) {
      var maybeEnd = false;
      while (!source.endOfLine()) {
        var ch = source.next();
        if (maybeEnd && ch == '/') {
          setState(normal);
          break;
        }
        maybeEnd = (ch == '*');
      }
      return 'mss-comment';
    }

    function inString(quote) {
      return function(source, setState) {
        var escaped = false;
        while (!source.endOfLine()) {
          var ch = source.next();
          if (ch == quote && !escaped)
            break;
          escaped = !escaped && ch == '\\';
        }
        if (!escaped)
          setState(normal);
        return 'mss-string';
      };
    }

    return function(source, startState) {
      return tokenizer(source, startState || normal);
    };
  })();

  function indentMSS(inBraces, inRule, base) {
    return function(nextChars) {
      if (!inBraces || /^\}/.test(nextChars)) return base;
      else if (inRule) return base + indentUnit * 2;
      else return base + indentUnit;
    };
  }

  // This is a very simplistic parser -- since MSS does not really
  // nest, it works acceptably well, but some nicer colouroing could
  // be provided with a more complicated parser.
  function parseMSS(source, basecolumn) {
    basecolumn = basecolumn || 0;
    identifiers = this.mss_identifiers;
    colors = this.mss_colors;
    values = this.mss_values;
    var tokens = tokenizeMSS(source);
    var inBraces = false, inRule = false, inDecl = false;

    var iter = {
      next: function() {
        var token = tokens.next(), style = token.style, content = token.content;

        if (style == 'mss-hash')
          style = token.style = inRule ? 'mss-colorcode' : 'mss-identifier';
        if (style == 'mss-identifier') {
          if (inRule) token.style = (values[token.content]) ? 'mss-known-value' : 'mss-value';
          else if (!inBraces && !inDecl) token.style = 'mss-selector';
        }

        if (content == '\n')
          token.indentation = indentMSS(inBraces, inRule, basecolumn);

        if (content == '{' && inDecl == '@media')
          inDecl = false;
        else if (content == '{')
          inBraces = true;
        else if (content == '}')
          inBraces = inRule = inDecl = false;
        else if (content == ';')
          inRule = inDecl = false;
        else if (inBraces && style != 'mss-comment' && style != 'whitespace')
          inRule = true;
        else if (!inBraces && style == 'mss-at')
          inDecl = content;

        return token;
      },

      copy: function() {
        var _inBraces = inBraces, _inRule = inRule, _tokenState = tokens.state;
        return function(source) {
          tokens = tokenizeMSS(source, _tokenState);
          inBraces = _inBraces;
          inRule = _inRule;
          return iter;
        };
      }
    };
    return iter;
  }

  return {
      make: parseMSS,
      electricChars: '}',
      configure: function(config) {
          this.mss_identifiers = (function() {
              var list = {};
              for (var i in config.symbolizers) {
                  for (var j in config.symbolizers[i]) {
                      if (config.symbolizers[i][j].hasOwnProperty('css')) {
                          list[config.symbolizers[i][j].css] = true;
                      }
                  }
              }
              return list;
          })();
          this.mss_values = (function() {
              var list = {};
              for (var i in config.symbolizers) {
                  for (var j in config.symbolizers[i]) {
                      if (Array.isArray(config.symbolizers[i][j].type)) {
                          for (var k in config.symbolizers[i][j].type) {
                            list[config.symbolizers[i][j].type[k]] = true;
                          }
                      }
                  }
              }
              return list;
          })();
          this.mss_colors = (function() {
              var list = {};
              for (var i in config.colors) {
                  list[i] = true;
              }
              return list;
          })();
      }
  };
})();
