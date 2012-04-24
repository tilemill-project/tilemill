function format(output) {
    var prefix = '[' + process.title + '] ';
    if (output[output.length - 1] === '\n') {
        output = output.substring(0, output.length - 1);
    }
    console.warn(prefix + output.split('\n').join('\n' + prefix));
}

function onData(proc) {
    proc.stdout.setEncoding('utf8');
    proc.stdout.on('data', format.bind(global));
    proc.stderr.setEncoding('utf8');
    proc.stderr.on('data', format.bind(global));
}

module.exports = {
    onData: onData
};
