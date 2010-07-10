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

define("port", default=8889, help="run on the given port", type=int)
define("files", default=os.path.dirname(__file__), help="files directory", type=str)
define("config", default=os.path.join(os.path.dirname(__file__), "tilemill.cfg"), help="path to configuration file", type=str)

class TileMill(tornado.web.RequestHandler):
    def json(self, json):
        """ serve a page with an optional jsonp callback """
        if self.get_argument('jsoncallback', None):
            json = tornado.escape.json_encode(json)
            json = "%s(%s)" % (self.get_argument('jsoncallback', None), json)
            self.set_header('Content-Type', 'text/javascript')
        self.write(json)

class ListHandler(TileMill):
    def get(self):
        directories = []
        path = os.path.join(options.files, self.request.arguments['type'][0])
        for root, dirs, files in os.walk(path):
            basename = os.path.basename(root)
            if os.path.isfile(os.path.join(root, basename + '.mml')):
                directories.append(basename)
        self.json(directories)

class AddHandler(TileMill):
    def post(self):
        name = self.request.arguments['id'][0]
        directory = os.path.join(self.request.arguments['type'][0], name)
        if os.path.isdir(directory):
            self.json({ 'status': False, 'message': 'The directory %s already exists' % (name) })
        else:
            os.makedirs(directory)
            self.json({ 'status': True })

class FileHandler(TileMill):
    def get(self):
        path = os.path.join(options.files, self.get_argument('filename'))
        if os.path.isfile(path):
            buffer = open(path)
            data = buffer.read()
            buffer.close()
            self.json(data)
        else:
            self.json({ 'status': False, 'message': 'The file could not be found' })
    def post(self):
        path = os.path.join(options.files, self.get_argument('filename'))
        data = self.get_argument('data')
        if os.path.isdir(os.path.dirname(path)):
            buffer = open(path, 'w')
            buffer.writelines(data)
            buffer.close()
            self.json({ 'status': True })
        else:
            self.json({ 'status': False, 'data': 'Could not write file' })

class Application(tornado.web.Application):
    def __init__(self):
        handlers = [
            (r"/list", ListHandler),
            (r"/add", AddHandler),
            (r"/file", FileHandler),
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
