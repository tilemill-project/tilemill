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

from tornado.options import define, options

define("port", default=8889, help="run on the given port", type=int)
define("projects", default=os.path.join(os.path.dirname(__file__), "projects"), help="projects directory", type=str)
define("config", default=os.path.join(os.path.dirname(__file__), "tilemill.cfg"), help="path to configuration file", type=str)
define("tilelive_server", "http://localhost:8888/", help="path to tilelive server file", type=str)

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
            manager = ProjectManager(options);
            mml = tornado.escape.json_encode(manager.read(self.request.arguments['id'][0], self.request.arguments['id'][0] + '.mml'));
            url = self.request.protocol + '://' + self.request.host + '/';
            self.render("project.html", project_id=project_id, messages = [], mml = mml, tilelive = options.tilelive_server, url=url);
        else:
            tornado.web.HTTPError(404)

class ProjectNewHandler(tornado.web.RequestHandler):
    def post(self):
        # Add a new project.
        project_id = self.request.arguments['name'][0]
        manager = ProjectManager(options)
        stylesheet = self.request.protocol + '://' + self.request.host + '/projects/mss?id=' + project_id + '&amp;filename=' + project_id;
        result, message = manager.new(project_id, self, self.render_string('template.mml', stylesheet = stylesheet), self.render_string('template.mss'))
        if result:
            self.redirect('/projects/edit?id=' + tornado.escape.url_escape(project_id))
        else:
            self.redirect('/?message=' + tornado.escape.url_escape(message))

class ProjectMMLHandler(tornado.web.RequestHandler):
    extension = '.mml'
    def post(self):
        if re.match('^([A-Za-z0-9_-]+)$', self.filename()):
            manager = ProjectManager(options);
            manager.save(self.request.arguments['id'][0], self.filename() + self.extension, self.request.arguments['data'][0]);
    def get(self):
        if re.match('^([A-Za-z0-9_-]+)$', self.filename()):
            manager = ProjectManager(options);
            self.write(manager.read(self.request.arguments['id'][0], self.filename() + self.extension));
    def filename(self):
        return self.request.arguments['id'][0]

class ProjectMSSHandler(ProjectMMLHandler):
    extension = '.mss'
    def filename(self):
        return self.request.arguments['filename'][0]

class BasicEditHandler(tornado.web.RequestHandler):
    def get(self):
        project_id = self.request.arguments['id'][0]
        # Test that project exists.
        if True:
            manager = ProjectManager(options);
            mml = tornado.escape.json_encode(manager.read(self.request.arguments['id'][0], self.request.arguments['id'][0] + '.mml'));
            url = self.request.protocol + '://' + self.request.host + '/';
            self.render("basic.html", project_id=project_id, mml = mml, tilelive = options.tilelive_server, url=url);
        else:
            tornado.web.HTTPError(404)

class BasicNewHandler(tornado.web.RequestHandler):
    def post(self):
        # Add a new project.
        project_id = self.request.arguments['name'][0]
        manager = ProjectManager(options)
        srs = '&srsWGS84;';
        stylesheet = self.request.protocol + '://' + self.request.host + '/projects/mss?id=' + project_id + '&amp;filename=' + project_id;
        result, message = manager.new(project_id, self.render_string('basic.mml', stylesheet = stylesheet, srs = srs, url = self.request.arguments['url'][0]), self.render_string('basic.mss'))
        if result:
            self.redirect('/basic/edit?id=' + tornado.escape.url_escape(project_id))
        else:
            self.redirect('/?message=' + tornado.escape.url_escape(message))

class BasicListHandler(tornado.web.RequestHandler):
    def get(self):
        # Scan the directory...
        manager = ProjectManager(options)
        messages = []
        if self.request.arguments and self.request.arguments['message']:
            messages.append(self.request.arguments['message'][0])
        self.render("basic_list.html", projects = manager.list(), messages = messages)

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

    def new(self, name, mml, mss):
        directory = os.path.join(self.options.projects, name)
        if os.path.isdir(directory):
            return (False, "The directory " + name + " already exists")
        os.mkdir(directory)
        self.save(name, name + '.mml', mml)
        self.save(name, name + '.mss', mss)
        return (True, "")

    def save(self, id, file, data):
        buffer = open(os.path.join(self.options.projects, id, file), 'w')
        buffer.writelines(data)
        buffer.close()

    def read(self, id, file):
        buffer = open(os.path.join(self.options.projects, id, file))
        data = buffer.read()
        buffer.close()
        return data

class Application(tornado.web.Application):
    def __init__(self):
        handlers = [
            (r"/", MainHandler),
            (r"/projects/edit", ProjectEditHandler),
            (r"/projects/new", ProjectNewHandler),
            (r"/projects/mml", ProjectMMLHandler),
            (r"/projects/mss", ProjectMSSHandler),
            (r"/basic/list", BasicListHandler),
            (r"/basic/edit", BasicEditHandler),
            (r"/basic/new", BasicNewHandler),
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
