'use strict';
const irc    = require('slate-irc');
const net    = require('net');
const Duplex = require('stream').Duplex

function ChatStream(channel, options) {
  Duplex.apply(this);
  options = options || {};

  this.channel  = channel;
  this.server   = options.server || 'irc.freenode.net';
  this.port     = options.port || 6667;
  this.username = options.username || this.generateUsername();
  this.password = options.password;
  this.socket   = net.connect({ host: this.server, port: this.port});
  this.client   = irc(this.socket);
  this.client.nick(this.username);
  this.client.user('username', this.username);

  this.socket.on('error', this.emit.bind(this, 'error'));
  this.onConnect();
}

(require('util')).inherits(ChatStream, Duplex);

ChatStream.prototype.generateUsername = function() {
  return 'rg' + (+(new Date()));
}

ChatStream.prototype.onConnect = function() {
  if (this.password)
    this.client.send('NickServ', `IDENTIFY ${this.password}`);

  process.nextTick(() => {
    this.emit('connected');
    this.join();
  });
}

ChatStream.prototype.join = function() {
  this.client.once('join', this.afterJoin.bind(this));
  this.client.join(`#${this.channel}`);
}

ChatStream.prototype.afterJoin = function() {
  this.emit('ready');
  this.client.on('message', (event) => {
    if (event.from === this.username)
      return;

    this.push(event.message);
  });
}

ChatStream.prototype.end = function() {
  this.client.quit();
  Duplex.prototype.end.call(this, arguments);
}

// Duplex methods

ChatStream.prototype._read = function() {}

ChatStream.prototype._write = function(chunk, enc, next) {
  this.client.send('#' + this.channel, chunk);
  next();
}

module.exports = ChatStream;
