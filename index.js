
var util = require('util');
var request = require('request');
var EventEmitter = require('events').EventEmitter;

function clear() {
  console.log('\033[2J\033[0f');
}

function getStatusString(status) {
  switch(status) {
    case 0: return 'none';
    case 1: return 'requesting';
    case 2: return 'done'
    case 3: return 'error'
  };
}

function Window(option) {
  this.option = option;
  this.status = 0;
}
util.inherits(Window, EventEmitter);

Window.prototype.request = function(url) {
  var self = this;
  this.url = url;
  this.status = 1;
  this._render();
  request(this.url, function(error, response, body) {
    self.status = response.statusCode === 200 ? 2 : 3;
    self._render();
  });
}

Window.prototype.render =
Window.prototype._render = function() {
  clear();
  console.log(util.format('> url: %s', this.url));
}

exports.Window = Window;