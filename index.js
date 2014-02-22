
var util = require('util');
var request = require('request');
var htmlparser = require('htmlparser');
var EventEmitter = require('events').EventEmitter;
var exec = require('child_process').exec;

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
  this.tagid = 0;
  this.lines = 0;
  this.document = {
    all: []
  };
  this.trace = [];
  this.cursor = this.document;
  this._init();

  // Just for debugging
  //this.rli = repl.start('>');
}
util.inherits(Window, EventEmitter);

Window.prototype._init = function() {
  var self = this;
  exec('tput lines', function(err, stdout, stderr) {
    self.maxLines = Number(stdout);
    self.emit('ready');
  });
};

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
  });
};

Window.prototype._parse = function(content) {
  var self = this;
  var handler = new htmlparser.DefaultHandler(function(err, dom) {
    dom.forEach(parseDomNode);
    function parseDomNode(node) {
      // break branch
      if (node.type !== 'tag') {
        if (node.type === 'text') {
          self.cursor.value = node.data;
          self.document.all.push(node);
        }
        return;
      }

      var name = node.name;
      if (!/html|head|title|body/i.test(node.name)) {
        name = util.format('%s_%d', node.name, self.tagid++);
      }

      self.cursor[name] = {};
      self.document.all.push(node);

      if (node.children) {
        self.trace.push(self.cursor);
        self.cursor = self.cursor[name];

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
      
      var result = '';
      var self = this;
      var coll = this.document.all;
      for (var i=0; i<coll.length; i++) {
        var node = coll[i];
        if (node.type === 'text') {
          var text = node.data.replace(/&nbsp;/g, ' ');
          text = text.replace(/&lt;/g, '<');
          text = text.replace(/&gt;/g, '>');
          result += text.trim();
        } else if (/p/i.test(node.name)) {
          if (self.lines++ >= self.maxLines) {
            break;
          } else {
            result += '\n';
          }
        }
      }
      console.log(result);
      break;
    default:
      console.log('Null');
  }
  return this;
};

exports.Window = Window;