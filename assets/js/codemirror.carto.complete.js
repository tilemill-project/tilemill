// CodeMirror2 Autocompletion for Carto
(function (context) {
    if (!$) throw new Error('$-library expected');
    function cartoCompletion(editor, reference) {

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
            return ids;
        })(reference);

        function complete(e) {
            // We want a single cursor position.
            // Find the token at the cursor
            // If it's not a 'word-style' token, ignore the token.
            if (editor.somethingSelected()) return;

            var cur = editor.getCursor(false),
                token = editor.getTokenAt(cur),
                tprop = token;

            if (!/^[\w-$_]*$/.test(token.string)) {
                return false;
            }

            var completions = getCompletions(token, context);
            if (!completions.length) return;
            cancelEvent(e);

            function insert(str) {
                editor.replaceRange(str, {
                    line: cur.line,
                    ch: token.start
                }, {
                    line: cur.line,
                    ch: token.end
                });
            }
            // When there is only one completion, use it directly.
            if (completions.length == 1) {
                insert(completions[0]); return true;
            }

            // Build the select widget
            var widget = document.createElement('div');
            widget.className = 'completions';
            var sel = widget.appendChild(document.createElement('select'));
            // Opera doesn't move the selection when pressing up/down in a
            // multi-select, but it does properly support the size property on
            // single-selects, so no multi-select is necessary.
            if (!window.opera) sel.multiple = true;
            for (var i = 0; i < completions.length; ++i) {
                var opt = sel.appendChild(document.createElement('option'));
                opt.appendChild(document.createTextNode(completions[i]));
            }
            sel.firstChild.selected = true;
            sel.size = Math.min(10, completions.length);
            var pos = editor.cursorCoords();
            widget.style.height = '100px';
            sel.style.height = '100px';
            widget.style.position = 'absolute';
            widget.style.left = pos.x + 'px';
            widget.style.top = pos.yBot + 'px';
            document.body.appendChild(widget);
            // Hack to hide the scrollbar.
            if (completions.length <= 10)
                widget.style.width = (sel.clientWidth - 1) + 'px';

            var done = false;
            function close() {
                if (done) return;
                done = true;
                widget.parentNode.removeChild(widget);
            }
            function pick() {
                insert(sel.options[sel.selectedIndex].text);
                close();
                setTimeout(function(){
                    editor.focus();
                }, 50);
            }
            $(sel).blur(close);
            $(sel).keydown(function(event) {
                var code = event.keyCode;
                // Enter and space
                if (code == 13 || code == 32) {
                    cancelEvent(event);
                    pick();
                }
                // Escape
                else if (code == 27) {
                    cancelEvent(event);
                    close();
                    editor.focus();
                } else if (code != 38 && code != 40) {
                    close();
                    editor.focus();
                    setTimeout(complete, 50);
                }
            });
            $(sel).dblclick(pick);

            sel.focus();
            // Opera sometimes ignores focusing a freshly created node
            if (window.opera) setTimeout(function(){
                if (!done) sel.focus();
            }, 100);

            return true;
        }

        function getCompletions(token, context) {
            var r = new RegExp('^' + token.string);
            return _.filter(valid_identifiers, function(i) {
                return i.match(r);
            });
        }

        return {
            onKeyEvent: function(i, e) {
                // Hook into tab
                if (e.keyCode == 9 && !(e.ctrlKey || e.metaKey) && !e.altKey) {
                    return complete(e);
                }
            }
        };
    }

    context.cartoCompletion = cartoCompletion;
})(this);
