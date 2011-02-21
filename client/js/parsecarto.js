CodeMirror.defineMode("carto", function(config, parserConfig) {
  var indentUnit = config.indentUnit, type;

  var valid_identifiers = (function(reference) {
    var ids = {};
    for (var i in reference.symbolizers) {
      for (var j in reference.symbolizers[i]) {
        ids[reference.symbolizers[i][j].css] = true;
      }
    }
    return ids;
  })(parserConfig.reference);

  var valid_keywords = (function(reference) {
    var ids = {};
    for (var i in reference.symbolizers) {
      for (var j in reference.symbolizers[i]) {
        if (typeof reference.symbolizers[i][j].type == 'object') {
          for (var k in reference.symbolizers[i][j].type) {
            ids[reference.symbolizers[i][j].type[k]] = true;
          }
        }
      }
    }
    return ids;
  })(parserConfig.reference);

  function ret(style, tp) {type = tp; return style;}

  function tokenBase(stream, state) {
    var ch = stream.next();
    if (ch == "@") {stream.eatWhile(/\w/); return ret("carto-variable", stream.current());}
    else if (ch == "/" && stream.eat("*")) {
      state.tokenize = tokenCComment;
      return tokenCComment(stream, state);
    }
    else if (ch == "=") ret(null, "compare");
    else if ((ch == "~" || ch == "|") && stream.eat("=")) return ret(null, "compare");
    else if (ch == "\"" || ch == "'") {
      state.tokenize = tokenString(ch);
      return state.tokenize(stream, state);
    }
    else if (ch == "#") {
      stream.eatWhile(/[\w\-]/);
      return ret("carto-selector", "hash");
    }
    else if (/\d/.test(ch)) {
      stream.eatWhile(/[\w.%]/);
      return ret("carto-unit", "unit");
    }
    else if (/[,.+>*\/]/.test(ch)) {
      return ret(null, "select-op");
    }
    else if (/[;{}:\[\]]/.test(ch)) {
      return ret(null, ch);
    }
    else {
      stream.eatWhile(/[\w\\\-_]/);
      return valid_identifiers[stream.current()] ? 
          ret("carto-valid-identifier", "identifier") :
          ret("carto-identifier", "identifier");
    }
  }

  function tokenCComment(stream, state) {
    var maybeEnd = false, ch;
    while ((ch = stream.next()) != null) {
      if (maybeEnd && ch == "/") {
        state.tokenize = tokenBase;
        break;
      }
      maybeEnd = (ch == "*");
    }
    return ret("carto-comment", "comment");
  }

  function tokenString(quote) {
    return function(stream, state) {
      var escaped = false, ch;
      while ((ch = stream.next()) != null) {
        if (ch == quote && !escaped)
          break;
        escaped = !escaped && ch == "\\";
      }
      if (!escaped) state.tokenize = tokenBase;
      return ret("carto-string", "string");
    };
  }

  return {
    startState: function(base) {
      return {tokenize: tokenBase,
              baseIndent: base || 0,
              stack: []};
    },

    token: function(stream, state) {
      if (stream.eatSpace()) return null;
      var style = state.tokenize(stream, state);

      var context = state.stack[state.stack.length-1];
      if (type == "hash" && context == "rule") style = "carto-colorcode";
      else if (style == "carto-identifier") {
        if (context == "rule") style = valid_keywords[stream.current()] ?
          "carto-valid-value" :
          "carto-value";
        else if (!context || context == "@media{") style = "css-selector";
      }

      if (context == "rule" && /^[\{\};]$/.test(type))
        state.stack.pop();
      if (type == "{") {
        if (context == "@media") state.stack[state.stack.length-1] = "@media{";
        else state.stack.push("{");
      }
      else if (type == "}") state.stack.pop();
      else if (type == "@media") state.stack.push("@media");
      else if (context != "rule" && context != "@media" && type != "comment") state.stack.push("rule");
      return style;
    },

    indent: function(state, textAfter) {
      var n = state.stack.length;
      if (/^\}/.test(textAfter))
        n -= state.stack[state.stack.length-1] == "rule" ? 2 : 1;
      return state.baseIndent + n * indentUnit;
    }
  };
});

CodeMirror.defineMIME("text/carto", "carto");
