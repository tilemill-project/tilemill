var atom = require('app');
var spawn = require('child_process').spawn;
var BrowserWindow = require('browser-window');
var Menu = require('menu');
var shell = require('shell');
var dialog = require('dialog');
var path = require('path');
var log = require('./lib/log');
var logger = require('fastlog')('', 'debug', '<${timestamp}>');
var node = path.resolve(path.join(__dirname, 'vendor', 'node'));
var exec = require('child_process').exec;
var script = path.resolve(path.join(__dirname, 'index-server.js'));
var serverPort = null;
var mainWindow = null;

if (process.platform === 'win32') {
    atom.commandLine.appendSwitch('disable-gpu');
    process.env.HOME = process.env.USERPROFILE;
    shellsetup();
} else {
    var shellLog = path.join(process.env.HOME, '.tilemill', 'tilemill.log');
    log(shellLog, 10e6, shellsetup);
}

function shellsetup(err) {
    process.on('exit', function(code) {
        logger.debug('TileMill exited with', code + '.');
    });

    // Start the server child process.
    var server = spawn(node, [script]);
    server.on('exit', process.exit);

    server.stderr.on('data', function(data){
        var matches = data.toString().match(/Error:/g);
        if (matches) {
             var chosen = dialog.showMessageBox(null, {
                type: 'warning',
                message: 'There was an error',
                detail: data.toString() + '\n\n Please report this issue to https://github.com/mapbox/tilemill',
                buttons: ['Cancel', 'Open a GitHub ticket'],
            });
            if(chosen === 1) shell.openExternal('https://github.com/mapbox/tilemill/issues/new?title=Error&body=I encountered an error:' + encodeURIComponent('\n```\n' + data.toString() + '\n```\n'));
        }
    });

    server.stdout.on('data', function(data) {
        logger.debug(data.toString())
        var matches = data.toString().match(/Started \[Server Core:\d+\]./);
        if (matches) {
            serverPort = parseInt(data.toString().split(':')[1]);
            loadURL();
            logger.debug('TileMill @ http://localhost:' + serverPort);
        }
    });

    // Report crashes to our server.
    require('crash-reporter').start();

    atom.on('window-all-closed', exit);
    atom.on('will-quit', exit);

    function exit() {
        if (process.platform === 'win32') {
            var readLine = require('readline');
            var rl = readLine.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            rl.on('SIGINT', function() {
                server.emit('SIGINT');
            });
        } else {
            if (server) server.kill('SIGINT');
        }
        process.exit();
    };

    atom.on('ready', makeWindow);
};

function makeWindow() {
    mainWindow = new BrowserWindow({
        'width': 1060,
        'height': 700,
        'center': true,
        'min-width': 720,
        'min-height': 480,
        'title': 'TileMill',
        'node-integration': 'all',
        'web-preferences': {
            'webgl': true,
            'java': false,
            'webaudio': false
        }
    });

    mainWindow.loadUrl('file://' + path.join(__dirname, 'templates', 'loading.html'));
    mainWindow.on('closed', function() {
        mainWindow = null;
    });
    mainWindow.on('page-title-updated', function(e) {
        e.preventDefault();
    });

    createMenu();
}

function loadURL() {
    if (!mainWindow) return;
    if (!serverPort) return;
    mainWindow.loadUrl('http://localhost:' + serverPort);
}

function createMenu() {
    var template;

    if (process.platform == 'darwin') {
    template = [
      {
        label: 'TileMill',
        submenu: [
          {
            label: 'About TileMill',
            selector: 'orderFrontStandardAboutPanel:'
          },
          {
            type: 'separator'
          },
          {
            label: 'Hide TileMill',
            accelerator: 'Command+H',
            selector: 'hide:'
          },
          {
            label: 'Hide Others',
            accelerator: 'Command+Shift+H',
            selector: 'hideOtherApplications:'
          },
          {
            label: 'Show All',
            selector: 'unhideAllApplications:'
          },
          {
            type: 'separator'
          },
          {
            label: 'Quit TileMill',
            accelerator: 'Command+Q',
            selector: 'performClose:'
          }
        ]
      },
      {
        label: 'Edit',
        submenu: [
          {
            label: 'Cut',
            accelerator: 'Command+X',
            selector: 'cut:'
          },
          {
            label: 'Copy',
            accelerator: 'Command+C',
            selector: 'copy:'
          },
          {
            label: 'Paste',
            accelerator: 'Command+V',
            selector: 'paste:'
          },
          {
            label: 'Select All',
            accelerator: 'Command+A',
            selector: 'selectAll:'
          }
        ]
      },
      {
        label: 'View',
        submenu: [
          {
            label: 'Reload',
            accelerator: 'Command+R',
            click: function() { mainWindow.restart(); }
          },
          {
            label: 'Toggle Developer Tools',
            accelerator: 'Alt+Command+I',
            click: function() { mainWindow.toggleDevTools(); }
          },
          {
            type: 'separator'
          },
          {
            label: 'Toggle Full Screen',
            accelerator: 'Ctrl+Command+F',
            click: function() { mainWindow.setFullScreen(!mainWindow.isFullScreen()); }
          }
        ]
      },
      {
        label: 'Window',
        submenu: [
          {
            label: 'Minimize',
            accelerator: 'Command+M',
            selector: 'performMiniaturize:'
          }
        ]
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'Online Resources',
            click: function() { shell.openExternal('https://www.mapbox.com/tilemill/'); }
          },
          {
            label: 'TileMill Logs',
            click: function() {
                var cp = require("child_process");
                cp.exec("open -a /Applications/Utilities/Console.app ~/.tilemill/tilemill.log");
            }
          }
        ]
      }
    ];

    menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }
}