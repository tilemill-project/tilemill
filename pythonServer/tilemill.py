#!/usr/bin/env python

import os.path
import unicodedata
import tornado.httpserver
import tornado.ioloop
import tornado.options
import tornado.web
import tornado.escape
import tornado.template
import re
import shutil

from urlparse import urlparse
from tornado.options import define, options

define("port",
        default=8889,
        help="run on the given port",
        type=int)
define("files",
        default=os.path.dirname(__file__),
        help="files directory",
        type=str)
define("config",
        default=os.path.join(os.path.dirname(__file__), "tilemill.cfg"),
        help="path to configuration file",
        type=str)

class TileMill(tornado.web.RequestHandler):
    def json(self, json, force_json = False):
        """ serve a page with an optional jsonp callback """
        if self.get_argument('jsoncallback', None):
            json = tornado.escape.json_encode(json)
            json = "%s(%s)" % (self.get_argument('jsoncallback', None), json)
            self.set_header('Content-Type', 'text/javascript')
        elif force_json:
            json = tornado.escape.json_encode(json)
        self.write(json)
    def safePath(self, path):
        return True or path.find('..') == -1 and not re.search('[^\w.-_\/]', path)

class InfoHandler(TileMill):
    def get(self):
        self.json({ 'api': 'basic', 'version': 1.0 }, True)

class ListHandler(TileMill):
    def get(self):
        path = os.path.join(options.files, self.get_argument('filename'))
        if (self.safePath(path) and os.path.isdir(path)):
            directories = []
            for root, dirs, files in os.walk(path):
                basename = os.path.basename(root)
                if os.path.isfile(os.path.join(root, basename + '.mml')):
                    directories.append(basename)
            self.json({
                'status': True,
                'data': directories
                }, True)
        elif (self.safePath(path)):
            self.json({
                'status': False,
                'data': 'The file could not be found'
                }, True)
        else:
            self.json({
                'status': False,
                'data': 'Invalid filename'
                }, True)

class MtimeHandler(TileMill):
    def get(self):
        path = os.path.join(options.files, self.get_argument('filename'))
        if (self.safePath(path) and os.path.isfile(path)):
            mtime = os.path.getmtime(path)
            self.json({
                'status': True,
                'mtime': mtime,
                'filename': self.get_argument('filename')
                }, False)
        elif (self.safePath(path)):
            self.json({
                'status': False,
                'data': 'The file could not be found'
                }, True)
        else:
            self.json({
                'status': False,
                'data': 'Invalid filename'
                }, True)

class FileHandler(TileMill):
    def get(self):
        path = os.path.join(options.files, self.get_argument('filename'))
        if (self.safePath(path) and os.path.isfile(path)):
            buffer = open(path)
            data = buffer.read()
            buffer.close()
            self.json(data, False)
        elif (self.safePath(path)):
            self.json({
                'status': False,
                'data': 'The file could not be found'
                }, True)
        else:
            self.json({
                'status': False,
                'data': 'Invalid filename'
                }, True)

    def post(self):
        path = os.path.join(options.files, self.get_argument('filename'))
        if (self.safePath(path)):
            method = self.get_argument('method', 'put')
            data = self.get_argument('data', '')
            if method == 'delete':
                self.rm(path);
                self.json({
                    'status': True
                    }, True)
            else:
                if (not os.path.isdir(os.path.dirname(path))):
                    os.makedirs(os.path.dirname(path))
                if (os.path.isdir(os.path.dirname(path))):
                    buffer = open(path, 'w')
                    buffer.writelines(data)
                    buffer.close()
                    self.json({
                        'status': True
                        }, True)
                else:
                    self.json({
                        'status': False,
                        'data': 'Could not write file'
                        }, True)
        elif (self.safePath(path)):
            self.json({
                'status': False,
                'data': 'Could not write file'
                }, True)
        else:
            self.json({
                'status': False,
                'data': 'Invalid filename'
                }, True)

    def rm(self, path):
        for root, dirs, files in os.walk(path, topdown=False):
            for name in files:
                os.remove(os.path.join(root, name))
            for name in dirs:
                os.rmdir(os.path.join(root, name))

class Application(tornado.web.Application):
    def __init__(self):
        handlers = [
            (r"/", InfoHandler),
            (r"/list", ListHandler),
            (r"/file", FileHandler),
            (r"/mtime", MtimeHandler),
        ]
        settings = dict(
            template_path=os.path.join(os.path.dirname(__file__), "templates"),
            static_path=os.path.join(os.path.dirname(__file__), "static"),
        )
        tornado.web.Application.__init__(self, handlers, **settings)

def main():
    tornado.options.parse_config_file(options.config)
    tornado.options.parse_command_line()

    http_server = tornado.httpserver.HTTPServer(Application())
    http_server.listen(options.port)
    tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
    main()
