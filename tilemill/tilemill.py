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
define("projects", default=os.path.join(os.path.dirname(__file__), "projects"), help="projects directory", type=str)
define("config", default=os.path.join(os.path.dirname(__file__), "tilemill.cfg"), help="path to configuration file", type=str)

class MainHandler(tornado.web.RequestHandler):
    def get(self):
        # Scan the directory...
        manager = ProjectManager()
        self.render("home.html", projects = manager.list(options.projects))

class ProjectEditHandler(tornado.web.RequestHandler):
    def get(self):
        project_id = self.request.arguments['id'][0]
        # Test that project exists.
        if True:
            ProjectManager.list(directory=options.projects)
            self.render("project.html", project_id=project_id)
        else:
            tornado.web.HTTPError(404)

class ProjectNewHandler(tornado.web.RequestHandler):
    def post(self):
        # Add a new project.
        self.redirect('/projects/edit?id=' + self.request.arguments['name'][0])

class ProjectManager:
    """
    Retrieve a list of projects from the provided projects path. Projects are
    identified by a path relative to the projects path.
    """
    def list(self, projects_path):
        projects = []
        files = self.findByExtension(projects_path)
        for file in files:
            projects = projects + [os.path.relpath(file, projects_path)]
        return projects

    """
    Recurse through the provided path and retrieve a list of files that match
    the provided extension. Defaults to '.mml'
    """
    def findByExtension(self, path, extension = '.mml'):
        files = []
        if os.path.isfile(path) and os.path.splitext(path)[1] == extension:
            files = files + [path]
        elif os.path.isdir(path):
            for dir in os.listdir(path):
                files = files + self.findByExtension(os.path.join(path, dir), extension)
        return files

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
