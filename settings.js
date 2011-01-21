module.exports = {
    "port": 8889,
    "files": "files",
    "providers": {
        "directory": {
            "path": "files/data"
        }
    },
    'mapfile_dir': 'files/.cache',
    'data_dir': 'files/.cache',
    'export_dir': 'files/export',
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
