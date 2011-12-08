var config = Bones.plugin.config;
var passport = require('passport');
var util = require('util');
var OAuth2Strategy = require('passport-oauth').OAuth2Strategy;

server = Bones.Server.extend({});
server.prototype.initialize = function(app) {
    var auth = passport.authenticate('mapbox', { failureRedirect: '/oauth/mapbox/fail' });
    this.use(passport.initialize());
    this.get('/oauth/mapbox', auth);
    this.get('/oauth/mapbox/token', auth, function(req, res) {
        new models.Config().save({
            syncAccount: req.user.id,
            syncAccessToken: req.user.accessToken
        }, {
            success: function() {
                res.send('<script type="text/javascript">parent.postMessage("Authorized use with MapBox.", "*");</script>');
            },
            error: function() {
                res.send('<script type="text/javascript">parent.postMessage("Failed to save configuration.", "*");</script>');
            }
        });
    });
    this.get('/oauth/mapbox/fail', auth, function(req, res) {
        res.send('<script type="text/javascript">parent.postMessage("Failed authorization.", "*");</script>');
    });
    passport.use(new Strategy());
    passport.serializeUser(function(obj, done) { done(null, obj); });
    passport.deserializeUser(function(obj, done) { done(null, obj); });
};

// Add passport OAuth2 authorization.
function Strategy() {
    OAuth2Strategy.call(this, {
        authorizationURL: config.syncURL + '/oauth/authorize',
        tokenURL:         config.syncURL + '/oauth/access_token',
        clientID:         'tilemill',
        clientSecret:     'tilemill',
        callbackURL:      'http://0.0.0.0:' + config.port + '/oauth/mapbox/token'
    },
    function(accessToken, refreshToken, profile, callback) {
        profile.accessToken = accessToken;
        profile.refreshToken = refreshToken;
        return callback(null, profile);
    });
    this.name = 'mapbox';
}
util.inherits(Strategy, OAuth2Strategy);
Strategy.prototype.userProfile = function(accessToken, done) {
    this._oauth2.get(config.syncURL + '/oauth/user', accessToken, function (err, body) {
        if (err) { return done(err); }
        done(null, JSON.parse(body));
    });
};

