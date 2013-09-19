var IrcClient = require('irc').Client;
var Duplex    = require('stream').Duplex

function ChatStream(channel, options) {
  Duplex.apply(this);
  options = options || {};
  this.channel = channel;
  this.server = options['server'] || 'irc.freenode.net';
  this.username = options['username'] || this.generateUsername();
  this.password = options['password'];
  this.client = new IrcClient(this.server, this.username);
  this.client.on('registered', this.onConnect.bind(this));
  this.client.on('error', function(err) {
    this.emit('error', err);
  }.bind(this));
}

(require('util')).inherits(ChatStream, Duplex);

ChatStream.prototype.generateUsername = function() {
  return 'rg' + (+(new Date()));
}

ChatStream.prototype.onConnect = function() {
  if (this.password)
    this.client.say('NickServ', 'IDENTIFY ' + this.password);
  process.nextTick(function() {
    this.emit('connected');
    this.join();
  }.bind(this));
}

ChatStream.prototype.join = function() {
  this.client.join('#' + this.channel, this.afterJoin.bind(this));
}

ChatStream.prototype.afterJoin = function() {
  this.emit('ready');
  this.client.on('message#' + this.channel, function(nick, message) {
    if (this.username == nick) return;
    this.push(message);
  }.bind(this));
}

ChatStream.prototype.end = function() {
  var self = this;
  var args = arguments;
  this.client.disconnect(function() {
    Duplex.prototype.end.apply(self, args);
  });
}

// Duplex methods

ChatStream.prototype._read = function() {}

ChatStream.prototype._write = function(chunk, enc, next) {
  this.client.say('#' + this.channel, chunk);
  next();
}

module.exports = ChatStream;
