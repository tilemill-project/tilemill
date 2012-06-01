// CodeMirror2 Autocompletion for Carto
(function (context) {
    if (!$) throw new Error('$-library expected');
    if (!_) throw new Error('_-library expected');

    function cartoCompletion(editor, reference) {
        var widget = document.createElement('div'),
            sel = widget.appendChild(document.createElement('select')),
            ids = [],
            classes = [],
            $widget = $(widget),
            $sel = $(sel);

        function cancelEvent(e) {
            if (!e) return;
            e.cancelBubble = true;
            e.cancel = true;
            e.returnValue = false;
            if (e.stop) e.stop();
            if (e.stopPropagation) { e.stopPropagation(); }
            if (e.preventDefault) { e.preventDefault(); }
        }

        var valid_identifiers = (function(reference) {
            var ids = [];
            for (var i in reference.symbolizers) {
                for (var j in reference.symbolizers[i]) {
                    ids.push(reference.symbolizers[i][j].css);
                }
            }
            return _.uniq(ids);
        })(reference);

        var valid_keywords = [];
        var kw_by_property = {};
        var kw_reference = {};
        for (var i in reference.symbolizers) {
            for (var j in reference.symbolizers[i]) {
                kw_reference[reference.symbolizers[i][j].css] = reference.symbolizers[i][j].doc || '';
                if (typeof reference.symbolizers[i][j].type == 'object') {
                    var css = reference.symbolizers[i][j].css;
                    for (var k in reference.symbolizers[i][j].type) {
                        valid_keywords.push(reference.symbolizers[i][j].type[k]);
                        if (!kw_by_property[css]) kw_by_property[css] = [];
                        kw_by_property[css].push(reference.symbolizers[i][j].type[k]);
                    }
                }
            }
        }
        valid_keywords = _.uniq(valid_keywords);

        function getVariables() {
            var v = editor.getValue();
            return _.uniq(v.match(/@[\w\d\-]+/));
        }

        function getCompletions(token, cur) {
            var against;
            if (token.className === 'carto-value') {
                var l = editor.getLine(cur.line);
                var start = l.match(/\w/);
                var p = editor.getTokenAt({
                    line: cur.line,
                    ch: start.index + 1
                });
                if (p && p.className === 'carto-valid-identifier' &&
                    kw_by_property[p.string]) {
                        against = kw_by_property[p.string];
                }
            } else if (token.className === 'carto-variable') {
                against = getVariables();
            } else if (token.className === 'carto-selector') {
                if (token.string[0] == '.') {
                    against = classes;
                } else {
                    against = ids;
                }
            } else {
                against = valid_identifiers;
            }

            return _.filter(against, function(i) {
                return i.indexOf(token.string) === 0;
            }).map(function(i) {
                if (token.className === 'carto-value') {
                    return i + ';';
                } else if (token.className === 'carto-variable') {
                    return i;
                } else if (token.className === 'carto-selector') {
                    return i + ' {';
                } else {
                    return i + ':';
                }
            });
        }

        function complete(e) {
            // We want a single cursor position.
            // Find the token at the cursor
            // If it's not a 'word-style' token, ignore the token.
            if (editor.somethingSelected()) return;
            $(widget).remove();

            var cur = editor.getCursor(false),
                token = editor.getTokenAt(cur),
                done = false;

            // If this is not on a token that's autocompletable,
            // insert a tab.
            if (!/(@|#|\.)?[\w-$_]+$/.test(token.string)) {
                editor.focus();
                return !/^\s*$/.test(token.string);
            }

            function insert(str) {
                editor.replaceRange(str, {
                    line: cur.line,
                    ch: token.start
                }, {
                    line: cur.line,
                    ch: token.end
                });
            }

            function backspace() {
                editor.replaceRange('', {
                    line: cur.line,
                    ch: token.end - 1
                }, {
                    line: cur.line,
                    ch: token.end
                });
            }

            function close() {
                if (done) return;
                done = true;
                $(widget).remove();
            }

            function pick() {
                insert(sel.options[sel.selectedIndex].text);
                close();
                setTimeout(function(){
                    editor.focus();
                }, 50);
            }

            var completions = getCompletions(token, cur);
            if (!completions.length) {
                return true;
            } else if (completions.length == 1) {
                insert(completions[0]); return true;
            }

            completions.sort();

            // Build the select widget
            var pos = editor.cursorCoords();

            sel.innerHTML = '';
            sel.multiple = true;
            for (var i = 0; i < completions.length; ++i) {
                var opt = sel.appendChild(document.createElement('option'));
                opt.appendChild(document.createTextNode(completions[i]));
            }
            sel.firstChild.selected = true;
            sel.selectedIndex = 0;
            sel.size = completions.length;
            sel.style.height = '100px';

            widget.className = 'completions';
            widget.style.height = '100px';
            widget.style.position = 'absolute';
            widget.style.left = pos.x + 'px';
            widget.style.top = pos.yBot + 'px';

            document.body.appendChild(widget);

            // Hack to hide the scrollbar.
            if (completions.length <= 10) {
                widget.style.width = (sel.clientWidth - 1) + 'px';
            }

            $sel.blur(close);
            $sel.keydown(function(event) {
                var code = event.which;
                // Enter and space
                if (code === 13 || code === 32) {
                    cancelEvent(event);
                    pick();
                // tab forwards
                } else if (code === 9 && !event.shiftKey) {
                    cancelEvent(event);
                    sel.selectedIndex = (++sel.selectedIndex % sel.size);
                // shift-tab backwards
                } else if (code === 9) {
                    cancelEvent(event);
                    sel.selectedIndex = (--sel.selectedIndex === -1) ?
                        sel.size - 1 :
                        sel.selectedIndex;
                // Escape
                } else if (code === 27) {
                    cancelEvent(event);
                    close();
                    editor.focus();
                } else if (code === 8) {
                    backspace();
                    complete(e);
                    cancelEvent(event);
                } else if (code != 38 && code != 40 && !event.shiftKey) {
                    close();
                    editor.focus();
                    setTimeout(complete, 50);
                }
            });

            $sel.click(pick);
            $sel.focus();

            return true;
        }

        function setTitles() {
            var wrap = editor.getWrapperElement();
            var ids = $('.cm-carto-valid-identifier', wrap).each(function() {
                if (kw_reference[this.innerHTML]) {
                    this.title = kw_reference[this.innerHTML];
                }
            });
        }

        return {
            onKeyEvent: function(i, e) {
                // Hook into tab
                if (e.which == 9 && !(e.ctrlKey || e.metaKey) && !e.altKey) {
                    e.stop();
                    return complete(e);
                }
            },
            setTitles: function() {
                setTitles();
            },
            ids: function(x) {
                ids = x;
            },
            classes: function(x) {
                classes = x;
            }
        };
    }

    context.cartoCompletion = cartoCompletion;
})(this);
