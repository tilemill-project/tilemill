var path = require('path');
var spawn = require('child_process').spawn;
var exec  = require('child_process').exec;

var UTILS_DIR = path.join(__dirname, '../utils');

// In-memory job store
var jobs = {};

// Cached install-detection result; cleared after any start/stop/restart.
var cachedInstall = null;

// ---------------------------------------------------------------------------
// Output helpers
// ---------------------------------------------------------------------------

function processChunk(job, chunk) {
    var str = chunk.toString();
    for (var i = 0; i < str.length; i++) {
        var c = str[i];
        if (c === '\r') {
            if (str[i + 1] === '\n') { job.lines.push(job.currentLine); job.currentLine = ''; i++; }
            else { job.currentLine = ''; }
        } else if (c === '\n') {
            job.lines.push(job.currentLine); job.currentLine = '';
        } else {
            job.currentLine += c;
        }
    }
    if (job.lines.length > 2000) job.lines = job.lines.slice(-2000);
}

function jobOutput(job) {
    var out = job.lines.join('\n');
    if (job.currentLine) out += '\n' + job.currentLine;
    return out;
}

function spawnJob(jobId, cmd, args, opts) {
    jobs[jobId] = { status: 'running', lines: [], currentLine: '', exitCode: null };
    var child = spawn(cmd, args, opts || {});
    var capture = function(chunk) { processChunk(jobs[jobId], chunk); };
    child.stdout.on('data', capture);
    child.stderr.on('data', capture);
    child.on('exit', function(code) {
        jobs[jobId].exitCode = code;
        jobs[jobId].status = (code === 0) ? 'complete' : 'error';
    });
}

// ---------------------------------------------------------------------------
// Area name generation
// ---------------------------------------------------------------------------

function makeAreaName() {
    var d = new Date();
    return 'custom-' + d.getFullYear() +
        ('0' + (d.getMonth() + 1)).slice(-2) +
        ('0' + d.getDate()).slice(-2) + '-' +
        ('0' + d.getHours()).slice(-2) +
        ('0' + d.getMinutes()).slice(-2) +
        ('0' + d.getSeconds()).slice(-2);
}

// ---------------------------------------------------------------------------
// Installation detection
// ---------------------------------------------------------------------------

function detectInstall(callback) {
    if (cachedInstall !== null) return callback(cachedInstall);

    exec('brew services list 2>/dev/null', function(err, stdout) {
        if (!err) {
            var m = (stdout || '').match(/^(postgresql[^\s]*)/m);
            if (m) {
                var svc = m[1];
                return callback(cachedInstall = {
                    method: 'Homebrew', service: svc,
                    start:   'brew services start '   + svc,
                    stop:    'brew services stop '    + svc,
                    restart: 'brew services restart ' + svc
                });
            }
        }
        exec('systemctl list-units --type=service --all 2>/dev/null', function(err2, stdout2) {
            var m2 = (stdout2 || '').match(/(postgresql[^\s]*)/);
            if (!err2 && m2) {
                var svc2 = m2[1].replace(/\.service$/, '');
                return callback(cachedInstall = {
                    method: 'systemd', service: svc2,
                    start:   'sudo systemctl start '   + svc2,
                    stop:    'sudo systemctl stop '    + svc2,
                    restart: 'sudo systemctl restart ' + svc2
                });
            }
            exec('which service 2>/dev/null', function(err3, out3) {
                if (!err3 && out3.trim()) {
                    return callback(cachedInstall = {
                        method: 'SysV init', service: 'postgresql',
                        start:   'sudo service postgresql start',
                        stop:    'sudo service postgresql stop',
                        restart: 'sudo service postgresql restart'
                    });
                }
                exec('which pg_ctl 2>/dev/null', function(err4, out4) {
                    if (!err4 && out4.trim()) {
                        var suffix = process.env.PGDATA ? ' -D ' + process.env.PGDATA : '';
                        return callback(cachedInstall = {
                            method: 'pg_ctl', service: null,
                            start:   'pg_ctl start'   + suffix,
                            stop:    'pg_ctl stop'    + suffix,
                            restart: 'pg_ctl restart' + suffix
                        });
                    }
                    callback(cachedInstall = { method: null, service: null, start: null, stop: null, restart: null });
                });
            });
        });
    });
}

// ---------------------------------------------------------------------------
// Install hints by platform (shown when postgres is not found at all)
// ---------------------------------------------------------------------------

function getInstallHint() {
    var p = process.platform;
    if (p === 'darwin') return [
        'PostgreSQL client tools not found. To install:',
        '  Homebrew:     brew install postgresql@17',
        '  Postgres.app: https://postgresapp.com',
        '  Official:     https://www.postgresql.org/download/macosx/'
    ].join('\n');

    if (p === 'linux') return [
        'PostgreSQL client tools not found. To install:',
        '  Ubuntu/Debian: sudo apt-get install postgresql',
        '  RHEL/CentOS:   sudo yum install postgresql-server',
        '  Fedora:        sudo dnf install postgresql-server',
        '  Official:      https://www.postgresql.org/download/linux/'
    ].join('\n');

    return 'PostgreSQL not found.\nDownload from: https://www.postgresql.org/download/';
}

// ---------------------------------------------------------------------------
// Status queries
// ---------------------------------------------------------------------------

function psql(database, sql, cb) {
    exec('psql -d ' + database + ' -c ' + JSON.stringify(sql) + ' -t -A 2>/dev/null', cb);
}

function getBasicStatus(callback) {
    exec('command -v pg_isready || command -v psql', function(whichErr, whichOut) {
        if (whichErr || !(whichOut || '').trim()) {
            return callback(null, {
                installed: false,
                connected: false,
                installHint: getInstallHint()
            });
        }

        var result = { installed: true };
        var pending = 2;
        function check() { if (--pending === 0) callback(null, result); }

        exec('pg_isready', function(err, stdout) {
            result.connected  = !err;
            result.pgReadyMsg = (stdout || '')
                .replace(/\x1B\[[0-9;]*[mGKHFJABCDsu]/g, '')
                .replace(/\x1B\([A-Z0-9]/g, '')
                .trim();
            check();
        });

        detectInstall(function(info) {
            result.installMethod  = info.method;
            result.installService = info.service;
            result.startCmd       = info.start;
            result.stopCmd        = info.stop;
            result.restartCmd     = info.restart;
            check();
        });
    });
}

function getDetailStatus(callback) {
    var pending = 6;
    var result = {};
    function done() { if (--pending === 0) callback(null, result); }

    psql('postgres', 'SELECT version();', function(e, out) {
        if (!e) result.version = (out || '').trim();
        done();
    });

    psql('postgres', 'SHOW data_directory;', function(e, out) {
        if (!e) result.dataDir = (out || '').trim();
        done();
    });

    psql('postgres', 'SHOW port;', function(e, out) {
        if (!e) result.port = (out || '').trim();
        done();
    });

    psql('postgres',
        'SELECT count(*) FROM pg_stat_activity WHERE pid <> pg_backend_pid();',
        function(e, out) {
            if (!e) result.connections = (out || '').trim();
            done();
        });

    exec('pg_config --bindir 2>/dev/null', function(e, out) {
        if (!e) result.binDir = (out || '').trim();
        done();
    });

    psql('osm',
        "SELECT pg_size_pretty(pg_database_size('osm')), " +
        "EXISTS(SELECT FROM information_schema.tables " +
        "WHERE table_schema='public' AND table_name='planet_osm_point');",
        function(e, out) {
            if (!e && (out || '').trim()) {
                var parts = out.trim().split('\n')[0].split('|');
                result.osmDbExists     = true;
                result.osmDbSize       = parts[0];
                result.osmTablesLoaded = parts[1] === 't';
            } else {
                result.osmDbExists = false;
            }
            done();
        });
}

// ---------------------------------------------------------------------------
// Backbone sync
// ---------------------------------------------------------------------------

models.Postgres.prototype.sync = function(method, model, success, error) {
    switch (method) {

    case 'read':
        var id = model.id;
        if (id === 'dbstatus') {
            getBasicStatus(function(err, result) {
                if (err) return error(err);
                result.id = 'dbstatus';
                success(result);
            });
            return;
        }
        if (id === 'dbstatus-details') {
            getDetailStatus(function(err, result) {
                if (err) return error(err);
                result.id = 'dbstatus-details';
                success(result);
            });
            return;
        }
        var job = jobs[id];
        if (!job) return error(new Error('Job not found: ' + id));
        success({ id: id, status: job.status, output: jobOutput(job), exitCode: job.exitCode });
        break;

    case 'create':
        var data  = model.toJSON();
        var jobId = Date.now().toString();

        if (data.type === 'pgctl') {
            detectInstall(function(info) {
                var cmd = data.action === 'start'   ? info.start
                        : data.action === 'stop'    ? info.stop
                        : data.action === 'restart' ? info.restart : null;
                if (!cmd) return error(new Error(
                    'Cannot determine how to ' + data.action + ' PostgreSQL on this system.'));
                cachedInstall = null;
                spawnJob(jobId, 'bash', ['-c', cmd]);
                success({ id: jobId, status: 'running' });
            });
            return;
        }

        if (data.type === 'fetch') {
            if (!data.bbox ||
                !/^-?[0-9]+\.?[0-9]*,-?[0-9]+\.?[0-9]*,-?[0-9]+\.?[0-9]*,-?[0-9]+\.?[0-9]*$/.test(data.bbox))
                return error(new Error('Invalid bounding box format. Expected South,West,North,East.'));
            spawnJob(jobId, 'bash',
                [path.join(UTILS_DIR, 'loadosm.sh'), '-a', makeAreaName(), '-b', data.bbox],
                { cwd: UTILS_DIR });
            success({ id: jobId, status: 'running' });
            break;
        }

        if (data.type === 'load') {
            if (!data.filePath) return error(new Error('File path is required.'));
            spawnJob(jobId, 'bash',
                [path.join(UTILS_DIR, 'loadosm.sh'),
                 '-d', path.dirname(data.filePath),
                 '-f', path.basename(data.filePath)],
                { cwd: UTILS_DIR });
            success({ id: jobId, status: 'running' });
            break;
        }

        return error(new Error('Unknown job type: ' + data.type));

    default:
        error(new Error('Method not supported.'));
    }
};
