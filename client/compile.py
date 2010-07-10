#!/usr/bin/env python

import os.path
from HTMLParser import HTMLParser
import re

"""
Certain runtimes (like AIR) don't support dynamic function creation. Parse the
JavaScript and create the template beforehand.
"""

class Compiler(HTMLParser):
    script = ''
    scripts = {}
    inScript = False
    scriptName = ''
    def handle_startendtag(self, tag, attrs):
        if self.inScript:
            self.script += '<' + tag
            if attrs:
                for key, value in attrs:
                    self.script += ' ' + key + '=' + '"' + value + '"'
            self.script += '/>'

    def handle_starttag(self, tag, attrs):
        if self.inScript:
            self.script += '<' + tag
            if attrs:
                for key, value in attrs:
                    self.script += ' ' + key + '=' + '"' + value + '"'
            self.script += '>'
        if tag == 'script':
            found = False
            name = ''
            for i in attrs:
                if i[0] == 'type' and i[1] == 'text/html':
                    found = True
                elif i[0] == 'name':
                    name = i[1]
            if found:
                self.inScript = True
                self.scriptName = name

    def handle_endtag(self, tag):
        if tag == 'script' and self.inScript:
            self.inScript = False
            self.scripts[self.scriptName] = self.script
            self.script = ''
        elif self.inScript:
            self.script += '</' + tag + '>'

    def handle_data(self, data):
        if self.inScript:
            self.script += data

def main():
    html_path = os.path.join(os.path.dirname(__file__), 'index.html')
    buffer = open(html_path)
    data = buffer.read()
    buffer.close()
    parser = Compiler()
    parser.feed(data)
    parser.close()
    scripts = ''
    for name, script in parser.scripts.items():
        # Convert the template into pure JavaScript
        scr = re.sub(r'\s+', ' ', re.sub(r"(\r|\t|\n)", ' ', script))
        scr = scr.replace('<%', '\t')
        scr = re.sub(r"((^|%>)[^\t]*)'", r'\1\n', scr)
        scr = scr.replace("'", "\\'")
        scr = re.sub(r"\t=(.*?)%>", "',\\1,'", scr)
        scr = scr.replace("\t", "');").replace('%>', "p.push('").replace("\n", "\\'")
        scr = "TileMill.templates['%s']=function(obj) {var p=[],print=function(){p.push.apply(p,arguments);};with(obj){p.push('" % (name) + scr + "');}return p.join(''); }\n"
        scripts += scr
    js_path = os.path.join(os.path.dirname(__file__), 'js', 'includes', 'template.cache.js')
    buffer = open(js_path, 'w')
    buffer.write(scripts)
    buffer.close()


if __name__ == "__main__":
    main()
