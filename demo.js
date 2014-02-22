
var browserlib = require('./');
var Window = browserlib.Window;

var win = new Window();
win.on('ready', function() {
  win.request('http://www.baidu.com');
});

