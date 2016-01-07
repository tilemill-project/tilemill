CodeMirror.defineMode('carto', function(config, parserConfig) {
  var indentUnit = config.indentUnit, type;
  if (!parserConfig.reference) throw "Reference required.";

  var valid_identifiers = (function(reference) {
    var ids = {};
    for (var i in reference.symbolizers) {
      for (var j in reference.symbolizers[i]) {
        ids[reference.symbolizers[i][j].css] = true;
      }
    }
    return ids;
  })(parserConfig.reference);

  var valid_colors = (function(reference) {
    var ids = {};
    for (var i in reference.colors) {
      ids[i] = true;
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

  function ret(style, tp) { type = tp; return style; }

  function tokenBase(stream, state) {
    var ch = stream.next();
    if (ch == '@') {
      stream.eatWhile(/\w|\-|\_/);
      return ret('carto-variable', stream.current());
    } else if (ch == '/' && stream.eat('*')) {
      state.tokenize = tokenCComment;
      return tokenCComment(stream, state);
    } else if (ch == '/' && stream.eat('/')) {
      stream.skipToEnd();
      return ret("carto-comment", "comment");
    } else if (ch == '=' && stream.eat('~')) {
      return ret(null, 'compare');
    } else if (ch == '=') {
      return ret(null, 'compare');
    } else if (ch == '\"' || ch == "'") {
      state.tokenize = tokenString(ch);
      return state.tokenize(stream, state);
    } else if (ch == '#') {
      stream.eatWhile(/[\w\-]/);
      return ret('carto-selector', 'hash');
    } else if (ch == '.') {
      stream.eatWhile(/[\w\-]/);
      return ret('carto-selector', 'hash');
    } else if (/\-|\d/.test(ch)) {
      stream.eatWhile(/[\w.%]/);
      return ret('carto-unit', 'unit');
    } else if (/[,.+>*\/]/.test(ch)) {
      return ret(null, 'select-op');
    } else if (/[;{}:\[\]]/.test(ch)) {
      return ret(null, ch);
    } else {
      var current = null;
      while (current = stream.eat(/[a-zA-Z\\\-_\d\(]/)) {
        if (current == '(') break;
      }
      return valid_identifiers[stream.current()] ?
          ret('carto-valid-identifier', 'identifier') :
          ret('carto-identifier', 'identifier');
    }
  }

  function tokenCComment(stream, state) {
    var maybeEnd = false, ch;
    while ((ch = stream.next()) !== undefined) {
      if (maybeEnd && ch == '/') {
        state.tokenize = tokenBase;
        break;
      }
      maybeEnd = (ch == '*');
    }
    return ret('carto-comment', 'comment');
  }

  function tokenString(quote) {
    return function(stream, state) {
      var escaped = false, ch;
      while ((ch = stream.next()) !== undefined) {
        if (ch == quote && !escaped) {
          if (!escaped) state.tokenize = tokenBase;
          break;
        }
        escaped = !escaped && ch == '\\';
      }
      return ret('carto-string', 'string');
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
      var context = state.stack[state.stack.length - 1];
      if (type == 'hash' && (context == 'rule' || context == 'variable')) {
          style = 'carto-colorcode';
          if (parserConfig.onColor) {
              parserConfig.onColor(stream.current());
          }
      } else if (style == 'carto-identifier') {
        if (context == 'rule' || context == 'variable') {
          style = (valid_keywords[stream.current()] || valid_colors[stream.current()]) ?
            'carto-valid-value' :
            'carto-value';
        } else if (!context) {
          style = 'carto-selector';
        }
      }

      if (context == 'rule' && /^[\{\};]$/.test(type)) {
        state.stack.pop();
      }

      if (type == '{') {
        state.stack.push('{');
      } else if (type == '}') {
        state.stack.pop();
      } else if (context == '{' && type != 'comment') {
        state.stack.push('rule');
      }

      if (!context && type[0] == '@') {
          state.stack.push('variable');
      } else if (context == 'variable' && type == ';') {
          state.stack.pop();
      }

      return style;
    },

    indent: function(state, textAfter) {
      var n = state.stack.length;
      if (/^\}/.test(textAfter))
        n -= state.stack[state.stack.length - 1] == 'rule' ? 2 : 1;
      return state.baseIndent + n * indentUnit;
    }
  };
});

CodeMirror.defineMIME('text/carto', 'carto');
