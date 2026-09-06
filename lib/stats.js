var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var request = require('request');

// GA4 Measurement Protocol. Used only when the user has opted in via the
// "System Profile" setting (settings.profile).
var GA_MEASUREMENT_ID = 'G-SYHFMD013Y';
var GA_API_SECRET = 'AP-piCd3Q8S8av79LMmvtA';
var GA_ENDPOINT = 'https://www.google-analytics.com/mp/collect';

var configPath = path.join(process.env.HOME, '.tilemill/config.json');

// The profile report is anonymous, but events still need a stable per-install
// id (not tied to any account) so GA can distinguish installs from repeat
// pings. Persist it alongside the rest of the user config once generated.
function ensureGuid(settings) {
    if (settings.guid) return settings.guid;

    var guid = crypto.randomBytes(16).toString('hex');
    settings.guid = guid;

    try {
        var current = {};
        try { current = JSON.parse(fs.readFileSync(configPath, 'utf8')); }
        catch (e) {}
        current.guid = guid;
        fs.writeFileSync(configPath, JSON.stringify(current, null, 2));
        fs.chmodSync(configPath, 0600);
    } catch (err) {
        console.warn('Unable to persist anonymous profile id: %s', err.message);
    }

    return guid;
}

// Reduces a git remote URL to "owner/repo" (handling https, git://, and
// git@host:owner/repo.git forms) so forks are identifiable at a glance
// without leaking a full URL. Falls back to the raw remote if unrecognized.
function normalizeRepo(remote) {
    if (!remote || remote === 'unknown') return 'unknown';
    var match = remote.match(/github\.com[:\/]+([^\/]+)\/([^\/]+?)(\.git)?$/);
    return match ? (match[1] + '/' + match[2]) : remote;
}

// Reports a single anonymous "system_profile" event on app start: platform,
// CPU, memory, and TileMill version. No-op unless settings.profile is set.
module.exports.report = function(settings, abilities) {
    if (!settings.profile) return;

    var guid = ensureGuid(settings);
    var cpus = abilities.cpus || [];
    var repo = abilities.repo || {};

    request.post({
        url: GA_ENDPOINT,
        qs: {
            measurement_id: GA_MEASUREMENT_ID,
            api_secret: GA_API_SECRET
        },
        json: {
            client_id: guid,
            events: [{
                name: 'system_profile',
                params: {
                    engagement_time_msec: 1,
                    tilemill_version: (abilities.tilemill && abilities.tilemill.version) || 'unknown',
                    platform: abilities.platform,
                    cpu_model: cpus[0] && cpus[0].model,
                    cpu_count: cpus.length,
                    total_memory_mb: Math.round((abilities.totalmem || 0) / 1048576),
                    repo: normalizeRepo(repo.remote),
                    branch: repo.branch || 'unknown'
                }
            }]
        },
        timeout: 5000
    }, function(err, res, body) {
        if (err) console.warn('Anonymous profile report failed: %s', err.message);
    });
};
