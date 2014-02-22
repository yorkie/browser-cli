
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
    case -1: return 'error';
    case 0: return 'none';
    case 1: return 'request';
    case 2: return 'parse';
    case 3: return 'render';
  }
}

function Window(option) {
  this.option = option;
  this.status = 0;
  this.depth = 0;
  this.document = {};
  this.trace = [];
  this.cursor = this.document;

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
    self.status = response.statusCode === 200 ? 2 : -1;
    self._render()._parse(body);

    self.title = self.document.html.head.title.value.slice(0, 50)+'...';
    self.body  = self.document.html.body;
    self._render();
    console.log(JSON.stringify(self.document, null,2));
  });
};

Window.prototype._parse = function(content) {
  var self = this;
  var handler = new htmlparser.DefaultHandler(function(err, dom) {
    dom.forEach(parseDomNode);
    function parseDomNode(node) {
      // break branch
      if (node.type !== 'tag') {
        if (node.type === 'text') self.cursor.value = node.data;
        return;
      }

      self.cursor[node.name] = {};
      if (node.children) {
        self.trace.push(self.cursor);console.log(self.trace.length);
        self.cursor = self.cursor[node.name];

        if (typeof node.children.forEach === 'function')
          node.children.forEach(parseDomNode);
        else
          parseDomNode(node.children);

        self.cursor = self.trace.pop();
      }
    }

  });
  var parser = new htmlparser.Parser(handler);
  parser.parseComplete(content);
  self.status = 3;
};

Window.prototype.render =
Window.prototype._render = function() {
  clear();
  switch (this.status) {
    case -1:
    case 0:
    case 1:
      console.log(util.format(' \033[90murl: %s\033[0m', this.url));
      break;
    case 2:
      console.log(util.format(' \033[36murl: %s\033[0m', this.url));
      break;
    case 3:
      console.log(util.format(' \033[36murl: %s\033[0m', this.url));
      console.log(util.format(' \033[36mtitle:\033[0m \033[90m%s\033[0m', this.title));
      console.log(util.format(' \033[90m%s\033[0m', '=============================='));
      break;
    default:
      console.log('Null');
  }
  return this;
};

exports.Window = Window;