#!/usr/bin/env python

import os.path
import unicodedata
import tornado.httpserver
import tornado.ioloop
import tornado.options
import tornado.web
import tornado.escape
import tornado.template

from tornado.options import define, options

define("port", default=8888, help="run on the given port", type=int)
define("projects", default="projects", help="projects directory", type=str)
define("config", default=os.path.join(os.path.dirname(__file__), "tilemill.cfg"), help="path to configuration file", type=str)

class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("home.html")

class ProjectHandler(tornado.web.RequestHandler):
    def get(self, project_id):
        # Test that project exists.
        if True:
            self.render("project.html", project_id=project_id)
            # self.write("You requested the project " + project_id)
        else:
            tornado.web.HTTPError(404)

class Application(tornado.web.Application):
    def __init__(self):
        handlers = [
            (r"/", MainHandler),
            (r"/(\w+)", ProjectHandler),
        ]
        settings = dict(
            tilemill_title=u"TileMill",
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
