var FreemarkerParser = Editor.Parser = (function() {
        var directives = ["if", "elseif", "else", "list", "foreach", "switch", "case", "assign", "global",
                          "local", "include", "import", "function", "macro", "transform", "visit", "stop",
                          "return", "call", "setting", "compress", "comment", "noparse", "attempt", "recover"];

        // Simple stateful tokenizer for Freemarker documents. Returns a
        // MochiKit-style iterator, with a state property that contains a
        // function encapsulating the current state. See tokenize.js.
        var tokenizeFreemarker = (function() {
                function inText(source, setState) {
                    var ch = source.next();
                    if (ch == "<") {
                        if (source.equals("!")) {
                            source.next();
                            if (source.lookAhead("--", true)) {
                                setState(inBlock("freemarker-comment", "-->"));
                                return null;
                            } else {
                                return "freemarker-text";
                            }
                        } else {
                            source.nextWhileMatches(/[\#\@\/]/);
                            setState(inFreemarker(">"));
                            return "freemarker-boundary";
                        }
                    }
                    else if (ch == "[") {
                        source.nextWhileMatches(/[\#\@\/]/);
                        setState(inFreemarker("]"));
                        return "freemarker-boundary";
                    }
                    else if (ch == "$") {
                        if(source.matches(/[\{\w]/)) {
                            setState(pendingFreemarker);
                            return "freemarker-boundary";
                        } else {
                            return "freemarker-text";
                        }
                    }
                    else {
                        source.nextWhileMatches(/[^\$<\n]/);
                        return "freemarker-text";
                    }
                }

                function pendingFreemarker(source, setState) {
                    var ch = source.next();
                    if(ch == "{") {
                        setState(inFreemarker("}"));
                        return "freemarker-boundary";
                    } else {
                        source.nextWhileMatches(/\w/);
                        setState(inText);
                        return "freemarker-identifier";
                    }
                }

                function inFreemarker(terminator) {
                    return function(source, setState) {
                        var ch = source.next();
                        if (ch == terminator) {
                            setState(inText);
                            return "freemarker-boundary";
                        } else if (/[?\/]/.test(ch) && source.equals(terminator)) {
                            source.next();
                            setState(inText);
                            return "freemarker-boundary";
                        } else if(/[?!]/.test(ch)) {
                            if(ch == "?") {
                                if(source.peek() == "?") {
                                    source.next();
                                } else {
                                    setState(inBuiltIn(inFreemarker(terminator)));
                                }
                            }
                            return "freemarker-punctuation";
                        } else if(/[()+\/\-*%]/.test(ch)) {
                            return "freemarker-punctuation";
                        } else if (/[0-9]/.test(ch)) {
                            source.nextWhileMatches(/[0-9]+\.?[0-9]* /);
                            return "freemarker-number";
                        } else if (/\w/.test(ch)) {
                            source.nextWhileMatches(/\w/);
                            return "freemarker-identifier";
                        } else if(/[\'\"]/.test(ch)) {
                            setState(inString(ch, inFreemarker(terminator)));
                            return "freemarker-string";
                        } else {
                            source.nextWhileMatches(/[^\s\u00a0<>\"\'\}?!\/]/);
                            return "freemarker-generic";
                        }
                    };
                }

                function inBuiltIn(nextState) {
                    return function(source, setState) {
                        var ch = source.peek();
                        if(/[a-zA-Z_]/.test(ch)) {
                            source.next();
                            source.nextWhileMatches(/[a-zA-Z_0-9]+/);
                            setState(nextState);
                            return "freemarker-builtin";
                        } else {
                            setState(nextState);
                        }
                    };
                }

                function inString(quote, nextState) {
                    return function(source, setState) {
                        while (!source.endOfLine()) {
                            if (source.next() == quote) {
                                setState(nextState);
                                break;
                            }
                        }
                        return "freemarker-string";
                    };
                }

                function inBlock(style, terminator) {
                    return function(source, setState) {
                        while (!source.endOfLine()) {
                            if (source.lookAhead(terminator, true)) {
                                setState(inText);
                                break;
                            }
                            source.next();
                        }
                        return style;
                    };
                }

                return function(source, startState) {
                    return tokenizer(source, startState || inText);
                };
            })();

        function parseFreemarker(source) {
            var tokens = tokenizeFreemarker(source);
            var space = 0;

            function indentTo(n) {return function() {return n;}}

            function contains(array, value) {
                var i = array.length;
                while (i--) {
                    if (array[i] === value) {
                        return true;
                    }
                }
                return false;
            }
            
            var iter = {
                next: function() {
                    var token = tokens.next();
                    if (token.type == "whitespace") {
                        if (token.value == "\n") {
                            token.indentation = indentTo(space);
                        } else {
                            space = token.value.length;
                        }
                    }

                    if(token.type == "freemarker-identifier") {
                        if(contains(directives, token.value.replace(/^\s+|\s+$/g, ''))) {
                            token.style = "freemarker-directive";
                            token.type = "freemarker-directive";
                        }
                    }

                    return token;
                },

                copy: function() {
                    var _tokenState = tokens.state;
                    var _space = space;
        
                    return function(input) {
                        space = _space;
                        tokens = tokenizeFreemarker(input, _tokenState);
                        return iter;
                    };
                }
            };
            
            return iter;
        }
        return {make: parseFreemarker};
    })();
