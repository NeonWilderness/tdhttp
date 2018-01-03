const fs = require('fs');

function hook_stream(stream, callback) {
  let old_write = stream.write

  stream.write = (function(write) {
    return function(string, encoding, fd) {
      write.apply(stream, arguments)  // comments this line if you don't want output in the console
      callback(string, encoding, fd)
    }
  })(stream.write)

  return function() {
    stream.write = old_write
  }
}

let log_file = fs.createWriteStream(__dirname + '/build.log', {flags : 'w'});

let unhook_stdout = hook_stream(process.stdout, function(string, encoding, fd) {
  log_file.write(string, encoding)
});

let unhook_stderr = hook_stream(process.stderr, function(string, encoding, fd) {
  log_file.write(string, encoding)
});

module.exports = {
  unhook_stdout,
  unhook_stderr
};