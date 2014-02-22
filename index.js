
var util = require('util');
var request = require('request');

function clear() {
  console.log('\033[2J\033[0f');
}

function Window(option) {
  this.url = 'https://www.google.com'
}



Window.prototype.render = function() {
  clear();
  console.log(util.format('## url: %s', this.url));
}

exports.Window = Window;