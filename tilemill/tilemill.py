#!/usr/bin/env python

import os.path
import unicodedata
import tornado.httpserver
import tornado.ioloop
import tornado.options
import tornado.web
import tornado.escape
import tornado.template
import shutil

from tornado.options import define, options

define("port", default=8888, help="run on the given port", type=int)
define("projects", default=os.path.join(os.path.dirname(__file__), "projects"), help="projects directory", type=str)
define("config", default=os.path.join(os.path.dirname(__file__), "tilemill.cfg"), help="path to configuration file", type=str)
define("starter_mml", default=os.path.join(os.path.dirname(__file__), "starter.mml"), help="path to starter mml file", type=str)

class MainHandler(tornado.web.RequestHandler):
    def get(self):
        # Scan the directory...
        manager = ProjectManager(options)
        messages = []
        if self.request.arguments and self.request.arguments['message']:
            messages.append(self.request.arguments['message'][0])
        self.render("home.html", projects = manager.list(), messages = messages)

class ProjectEditHandler(tornado.web.RequestHandler):
    def get(self):
        project_id = self.request.arguments['id'][0]
        # Test that project exists.
        if True:
            self.render("project.html", project_id=project_id, messages = [])
        else:
            tornado.web.HTTPError(404)

class ProjectNewHandler(tornado.web.RequestHandler):
    def post(self):
        # Add a new project.
        project_id = self.request.arguments['name'][0]
        manager = ProjectManager(options)
        result, message = manager.new(project_id)
        if result:
            self.redirect('/projects/edit?id=' + tornado.escape.url_escape(project_id))
        else:
            self.redirect('/?message=' + tornado.escape.url_escape(message))

class ProjectManager:
    def __init__(self, options):
        self.options = options
        
    def list(self):
        """Retrieve a relative paths of projects."""
        projects = []
        for root, dirs, files in os.walk(self.options.projects):
            basename = os.path.basename(root)
            if os.path.isfile(os.path.join(root, basename + '.mml')):
                projects.append(basename)
        return projects

    def new(self, name):
        directory = os.path.join(self.options.projects, name)
        if os.path.isdir(directory):
            return (False, "The directory " + name + " already exists")
        os.mkdir(directory)
        shutil.copyfile(self.options.starter_mml, os.path.join(directory, name + '.mml'))
        return (True, "")
    

class Application(tornado.web.Application):
    def __init__(self):
        handlers = [
            (r"/", MainHandler),
            (r"/projects/edit", ProjectEditHandler),
            (r"/projects/new", ProjectNewHandler),
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
