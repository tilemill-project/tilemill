view = Backbone.View.extend();

view.prototype.events = {
    'click a[href=#fetch]':      'fetchOSM',
    'click a[href=#load]':       'loadFile',
    'click a[href=#pg-start]':   'pgStart',
    'click a[href=#pg-stop]':    'pgStop',
    'click a[href=#pg-restart]': 'pgRestart',
    'click a[href=#pg-refresh]': 'pgRefresh',
    'click a[href=#pg-details]': 'toggleDetails'
};

view.prototype.initialize = function() {
    _(this).bindAll(
        'render', 'checkDBStatus', 'applyDetailsState', 'toggleDetails',
        'fetchOSM', 'loadFile',
        'pgStart', 'pgStop', 'pgRestart', 'pgRefresh',
        'startJob', 'pollJob', 'updateOutput'
    );
    this.pollTimer   = null;
    this.detailsOpen = false;
    this.render();
    this.checkDBStatus();
    $('.bleed a').removeClass('active');
    $('.bleed .postgres').addClass('active');
};

view.prototype.render = function() {
    $(this.el).html(templates.Postgres());
    var bbox = localStorage.getItem('tilemill.bbox') || '';
    this.$('input[name=bbox]').val(bbox);
    return this;
};

// ---------------------------------------------------------------------------
// Server management
// ---------------------------------------------------------------------------

view.prototype.checkDBStatus = function() {
    var self = this;
    self.$('.db-status-badge').text('Checking...').removeClass('connected disconnected');

    (new models.Postgres({ id: 'dbstatus' })).fetch({
        success: function(model) {
            var d = model.toJSON();

            // ── Not installed at all ──────────────────────────────────────
            if (d.installed === false) {
                self.$('.db-status-badge')
                    .text('Not Installed').removeClass('connected disconnected');
                self.$('.db-status-message').text('');
                self.$('.pg-install-hint').text(d.installHint || '');
                self.$('.pg-row-hint').show();
                self.$('.pg-btn-start, .pg-btn-stop, .pg-btn-restart').addClass('disabled');
                self.$('.pg-details-toggle').hide();
                return;
            }

            // ── Installed ─────────────────────────────────────────────────
            self.$('.pg-row-hint').hide();
            self.$('.pg-details-toggle').show();

            var connected = d.connected;
            self.$('.db-status-badge')
                .text(connected ? 'Running' : 'Stopped')
                .removeClass('connected disconnected')
                .addClass(connected ? 'connected' : 'disconnected');
            self.$('.db-status-message').text(
                d.pgReadyMsg ? ' — ' + d.pgReadyMsg : '');

            // Button states
            self.$('.pg-btn-start').toggleClass('disabled', connected);
            self.$('.pg-btn-stop, .pg-btn-restart').toggleClass('disabled', !connected);

            // Helper: set a detail row's value and mark it as having data.
            function setDetail(rowSel, valSel, text) {
                if (text) {
                    self.$(valSel).text(text);
                    self.$(rowSel).addClass('pg-has-data');
                } else {
                    self.$(rowSel).removeClass('pg-has-data').hide();
                }
            }

            setDetail('.pg-row-version',     '.pg-version',     d.version || '');
            setDetail('.pg-row-bindir',      '.pg-bindir',      d.binDir  || '');
            setDetail('.pg-row-datadir',     '.pg-datadir',     d.dataDir || '');

            if (d.installMethod) {
                var inst = d.installMethod + (d.installService ? '  (' + d.installService + ')' : '');
                setDetail('.pg-row-install', '.pg-install', inst);
            }

            if (d.port) {
                setDetail('.pg-row-port', '.pg-port', 'localhost : ' + d.port);
            }

            if (d.connections !== undefined && d.connections !== null && d.connections !== '') {
                setDetail('.pg-row-connections', '.pg-connections', d.connections + ' active');
            }

            if (connected) {
                var osmText = d.osmDbExists
                    ? 'osm  (' + d.osmDbSize + ')  —  ' +
                      (d.osmTablesLoaded ? 'data loaded' : 'no data loaded yet')
                    : 'osm database not found';
                setDetail('.pg-row-osmdb', '.pg-osmdb', osmText);
            }

            self.applyDetailsState();
        },
        error: function() {
            self.$('.db-status-badge').text('Unknown');
        }
    });
};

view.prototype.applyDetailsState = function() {
    if (this.detailsOpen) {
        this.$('.pg-detail.pg-has-data').show();
        this.$('.pg-detail:not(.pg-has-data)').hide();
        this.$('.pg-toggle-arrow').html('&#9660;');
    } else {
        this.$('.pg-detail').hide();
        this.$('.pg-toggle-arrow').html('&#9654;');
    }
};

view.prototype.toggleDetails = function(e) {
    e.preventDefault();
    this.detailsOpen = !this.detailsOpen;
    this.applyDetailsState();
    return false;
};

view.prototype.pgStart = function(e) {
    e.preventDefault();
    if (this.$('.pg-btn-start').hasClass('disabled')) return false;
    var self = this;
    this.startJob({ type: 'pgctl', action: 'start' }, function() {
        setTimeout(function() { self.checkDBStatus(); }, 1500);
    });
    return false;
};

view.prototype.pgStop = function(e) {
    e.preventDefault();
    if (this.$('.pg-btn-stop').hasClass('disabled')) return false;
    var self = this;
    this.startJob({ type: 'pgctl', action: 'stop' }, function() {
        setTimeout(function() { self.checkDBStatus(); }, 1500);
    });
    return false;
};

view.prototype.pgRestart = function(e) {
    e.preventDefault();
    if (this.$('.pg-btn-restart').hasClass('disabled')) return false;
    var self = this;
    this.startJob({ type: 'pgctl', action: 'restart' }, function() {
        setTimeout(function() { self.checkDBStatus(); }, 2000);
    });
    return false;
};

view.prototype.pgRefresh = function(e) {
    e.preventDefault();
    this.checkDBStatus();
    return false;
};

// ---------------------------------------------------------------------------
// OSM data jobs
// ---------------------------------------------------------------------------

view.prototype.fetchOSM = function(e) {
    e.preventDefault();
    var bbox = this.$('input[name=bbox]').val().trim();
    if (!bbox) { new views.Modal(new Error('Please enter a bounding box.')); return false; }
    this.startJob({ type: 'fetch', bbox: bbox });
    return false;
};

view.prototype.loadFile = function(e) {
    e.preventDefault();
    var filePath = this.$('input[name=file-path]').val().trim();
    if (!filePath) { new views.Modal(new Error('Please enter a file path.')); return false; }
    this.startJob({ type: 'load', filePath: filePath });
    return false;
};

// ---------------------------------------------------------------------------
// Job runner + poll loop
// ---------------------------------------------------------------------------

view.prototype.startJob = function(data, onComplete) {
    var self = this;
    if (this.pollTimer) { clearInterval(this.pollTimer); this.pollTimer = null; }

    this.$('.output-section').show();
    this.$('.output-console').html(ansiToHtml('Starting...\n'));
    this.$('.job-status').text('').removeClass('running complete error');

    (new models.Postgres(data)).save(null, {
        success: function(model) { self.pollJob(model.get('id'), onComplete); },
        error: function(model, err) {
            new views.Modal(err);
            self.$('.output-section').hide();
        }
    });
};

view.prototype.pollJob = function(jobId, onComplete) {
    var self = this;
    var job  = new models.Postgres({ id: jobId });
    var poll = function() {
        job.fetch({
            success: function(model) {
                var d = model.toJSON();
                self.updateOutput(d.output, d.status);
                if (d.status !== 'running') {
                    clearInterval(self.pollTimer);
                    self.pollTimer = null;
                    if (onComplete) onComplete(d.status);
                }
            },
            error: function() {
                clearInterval(self.pollTimer);
                self.pollTimer = null;
                self.$('.job-status').text('Poll error').addClass('error');
            }
        });
    };
    this.pollTimer = setInterval(poll, 2000);
    poll();
};

view.prototype.updateOutput = function(output, status) {
    var el = this.$('.output-console')[0];
    if (!el) return;
    el.innerHTML = ansiToHtml(output || '');
    el.scrollTop = el.scrollHeight;

    var badge = this.$('.job-status').removeClass('running complete error');
    if      (status === 'running')  badge.text('Running…').addClass('running');
    else if (status === 'complete') badge.text('Complete').addClass('complete');
    else if (status === 'error')    badge.text('Error').addClass('error');
};

// ---------------------------------------------------------------------------
// ANSI → HTML color converter
// ---------------------------------------------------------------------------

function ansiToHtml(str) {
    var fg = {
        '30':'#4a4a4a', '31':'#e05252', '32':'#73c990', '33':'#e5c07b',
        '34':'#61afef', '35':'#c678dd', '36':'#56b6c2', '37':'#abb2bf',
        '90':'#777',    '91':'#ff6b6b', '92':'#a8e6a3', '93':'#ffe066',
        '94':'#74b9ff', '95':'#fd79a8', '96':'#81ecec', '97':'#ffffff'
    };
    var out = '', spanOpen = false, i = 0, len = str.length;
    while (i < len) {
        var ch = str[i];
        if (ch === '\x1B') {
            var next = str[i + 1];
            if (next === '[') {
                var j = i + 2;
                while (j < len && (str.charCodeAt(j) < 0x40 || str.charCodeAt(j) > 0x7E)) j++;
                if (str[j] === 'm') {
                    var codes = (str.substring(i + 2, j) || '0').split(';');
                    for (var k = 0; k < codes.length; k++) {
                        var c = codes[k];
                        if (c === '0' || c === '') {
                            if (spanOpen) { out += '</span>'; spanOpen = false; }
                        } else if (fg[c]) {
                            if (spanOpen) out += '</span>';
                            out += '<span style="color:' + fg[c] + '">';
                            spanOpen = true;
                        }
                    }
                }
                i = j + 1;
            } else if (next === '(' || next === ')') {
                i += 3;
            } else {
                i += 2;
            }
        } else if (ch === '&') { out += '&amp;'; i++;
        } else if (ch === '<') { out += '&lt;';  i++;
        } else if (ch === '>') { out += '&gt;';  i++;
        } else { out += ch; i++; }
    }
    if (spanOpen) out += '</span>';
    return out;
}
