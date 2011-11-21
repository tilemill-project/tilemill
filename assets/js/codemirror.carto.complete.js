// CodeMirror2 Autocompletion for Carto
(function (context) {
    if (!$) throw new Error('$-library expected');
    if (!_) throw new Error('_-library expected');

    function cartoCompletion(editor, reference) {
        var widget = document.createElement('div'),
            sel = widget.appendChild(document.createElement('select')),
            $widget = $(widget),
            $sel = $(sel);

        function cancelEvent(e) {
            if (!e) return;
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

        var valid_keywords = (function(reference) {
            var ids = [];
            for (var i in reference.symbolizers) {
                for (var j in reference.symbolizers[i]) {
                    if (typeof reference.symbolizers[i][j].type == 'object') {
                        for (var k in reference.symbolizers[i][j].type) {
                            ids.push(reference.symbolizers[i][j].type[k]);
                        }
                    }
                }
            }
            return _.uniq(ids);
        })(reference);

        function getVariables() {
            var v = editor.getValue();
            return _.uniq(v.match(/@[\w\d\-]+/));
        }

        function getCompletions(token, context) {
            var against;
            if (token.className === 'carto-value') {
                against = valid_keywords;
            } else if (token.className === 'carto-variable') {
                against = getVariables();
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

            if (!/@?[\w-$_]+$/.test(token.string)) {
                editor.focus();
                return false;
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

            var completions = getCompletions(token, context);
            if (!completions.length) {
                return false;
            } else if (completions.length == 1) {
                insert(completions[0]); return true;
            }

            // Build the select widget
            var pos = editor.cursorCoords();

            sel.innerHTML = '';
            sel.multiple = true;
            for (var i = 0; i < Math.min(completions.length, 10); ++i) {
                var opt = sel.appendChild(document.createElement('option'));
                opt.appendChild(document.createTextNode(completions[i]));
            }
            sel.firstChild.selected = true;
            sel.size = Math.min(10, completions.length);
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

        return {
            onKeyEvent: function(i, e) {
                // Hook into tab
                if (e.which == 9 && !(e.ctrlKey || e.metaKey) && !e.altKey) {
                    cancelEvent(e);
                    return complete(e);
                }
            }
        };
    }

    context.cartoCompletion = cartoCompletion;
})(this);
