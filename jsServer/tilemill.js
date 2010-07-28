var express = require('express'), fs = require('fs');
var app = module.exports = express.createServer();
var files = 'projects'; // TODO: put in config

app.get('/',function(req,res,params){res.send({'api':'basic','version':1.0});});

app.get('/list', function(req, res, params) {
  // params['filename']
  // path = os.path.join(options.files, self.get_argument('filename'))
  // if (self.safePath(path) and os.path.isdir(path)):
  //     directories = []
  //     for root, dirs, files in os.walk(path):
  //         basename = os.path.basename(root)
  //         if os.path.isfile(os.path.join(root, basename + '.mml')):
  //             directories.append(basename)
       // res.send({'status': true, 'data': directories});
  // elif (self.safePath(path)):
      res.send({'status':false, 'data':'The file could not be found'});
  //else:
      res.send({'status':false, 'data':'Invalid filename'});
});

app.get('/file', function(req, res, params) {
  var path = files + '/' + params['filename']);
  try {
    // if (path.find('..') != -1 || not re.search('[^\w.-_\/]', path))
    //   throw Exception('Invalid filename');
    res.send(fs.readFileSync(path));
  }
  catch(Exception) {
    res.send({'status':false, 'data':'The file could not be found'})
  }
  // elif (self.safePath(path)):
  // else:
  //     res.send({ 'status': False, 'data': 'Invalid filename' })
});

app.post('/file', function(req, res, params) {
//    def post(self):
//        path = os.path.join(options.files, self.get_argument('filename'))
//        if (self.safePath(path)):
//            method = self.get_argument('method', 'put')
//            data = self.get_argument('data', '')
//            if method == 'delete':
//                self.rm(path);
//                res.send({ 'status': True }, True)
//            else:
//                if (not os.path.isdir(os.path.dirname(path))):
//                    os.makedirs(os.path.dirname(path))
//                if (os.path.isdir(os.path.dirname(path))):
//                    buffer = open(path, 'w')
//                    buffer.writelines(data)
//                    buffer.close()
//                    res.send({ 'status': True }, True)
//                else:
//                    res.send({ 'status': False, 'data': 'Could not write file' }, True)
//        elif (self.safePath(path)):
//            self.send({'status':false, 'data':'Could not write file' });
//        else:
//            self.send({'status':false, 'data':'Invalid filename' });
});

//    def rm(self, path):
//        for root, dirs, files in os.walk(path, topdown=False):
//            for name in files:
//                os.remove(os.path.join(root, name))
//            for name in dirs:
//                os.rmdir(os.path.join(root, name))
//

app.listen(3000);
