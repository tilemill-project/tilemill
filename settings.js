module.exports = {
    "port": 8889,
    "files": "../files",
    "providers": {
        "directory": { "path": "" }
    },
    'mapfile_dir': 'mapfiles',
    'data_dir': 'data',
    // TODO: request-specific overrides
    'header_defaults': {
        'Expires': new Date(Date.now() +
            1000 // second
            * 60 // minute
            * 60 // hour
            * 24 // day
            * 365 // year
            )
    }
}
