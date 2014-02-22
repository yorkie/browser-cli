
var util = require('util');
var request = require('request');
var htmlparser = require('htmlparser');
var EventEmitter = require('events').EventEmitter;
var repl = require('repl');

function clear() {
  console.log('\033[2J\033[0f');
}

function getStatusString(status) {
  switch(status) {
    case 0: return 'none';
    case 1: return 'requesting';
    case 2: return 'done';
    case 3: return 'error';
  }
}

function Window(option) {
  this.option = option;
  this.status = 0;

  // Just for debugging
  this.rli = repl.start('>');
}
util.inherits(Window, EventEmitter);

Window.prototype.request = function(url) {
  var self = this;
  this.url = url;
  this.status = 1;
  this._render();
  request(this.url, function(error, response, body) {
    self.status = response.statusCode === 200 ? 2 : 3;
    self._render()._parse(body);
  });
};

Window.prototype._parse = function(content) {
  var handler = new htmlparser.DefaultHandler(function(err, dom) {
    dom.forEach(parseDomNode);
    function parseDomNode(node) {
      console.log(node);
      if (node.children) {
        if (typeof node.children.forEach === 'function')
          node.children.forEach(parseDomNode);
        else
          parseDomNode(node.children);
      }
    }

  });
  var parser = new htmlparser.Parser(handler);
  parser.parseComplete(content);
};

Window.prototype.render =
Window.prototype._render = function() {
  clear();
  if (this.status < 2) {
    console.log(util.format(' \033[90murl %s\033[0m', this.url));
  } else if (this.status === 2) {
    console.log(util.format(' \033[36murl %s\033[0m', this.url));
  }
  return this;
};

exports.Window = Window;