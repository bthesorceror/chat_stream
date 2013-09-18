var ChatStream = require('./index');

var server = 'irc.freenode.net';
var username = process.argv[2];
var password = process.argv[3];

var channel = 'somerandomchannel1231';

var stream1 = new ChatStream(channel, {
  server: server,
  username: username,
  password: password
});

var stream2 = new ChatStream(channel);

stream2.setEncoding('utf8');

stream1.once('ready', function() {
  ([1, 2, 3, 4, 5]).forEach(function(num) {
    stream1.write(num.toString());
  });
});

setTimeout(function() {
  stream2.pipe(process.stdout);
}, 1000 * 30);

stream2.on('data', function(data) {
  console.log('EVENTED', data);
});

stream1.on('error', function(err) {
  console.log(err);
});

stream2.on('error', function(err) {
  console.log(err);
});

process.stdin.pipe(stream2);
