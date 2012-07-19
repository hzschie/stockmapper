var express = require('express'),
    http = require('http'),
    fs = require('fs');
    
var app = express(),
    server = http.createServer(app),
    io = require('socket.io').listen(server, {
      'log level': 0,
      'transports': ['xhr-polling'],
      'polling duration': 10,
      'browser client minification': true
    });

server.listen(process.env.PORT || 3000);

console.log("process.env = ", process.env);
// Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  
  app.use(express['static'](__dirname + '/public'));
  app.use(app.router);
});

var BundleUp = require('bundle-up');
BundleUp(app, __dirname + '/lib/assets', {
  staticRoot: __dirname + '/public/',
  staticUrlRoot:'/',
  bundle: (process.env.BUNDLE && process.env.BUNDLE.toLowerCase() == 'true'),
  minifyCss: true,
  minifyJs: true
});


var dataDomain = (process.env.DATA_DOMAIN || 'nyse').toLowerCase(),
    dataSourceClass;
switch(dataDomain) {
  case 'blufin':
    dataSourceClass = require(__dirname + '/lib/blufin_data_source.js').BlufinDataSource;
    break;
  case 'nyse':
    dataSourceClass = require(__dirname + '/lib/yahoo_data_source.js').YahooDataSource;
    break;
}
var dataSource = new dataSourceClass(function(data) {
  io.sockets.emit("update", Array.isArray(data[0]) ? data : [data]);
});

// Parse and Stringify the data to strip whitespace
var dataConfig = JSON.stringify(JSON.parse(
  fs.readFileSync(__dirname + '/public/data/' + dataDomain + '/config.json', 'utf8')
));


app.get('/*', function(req, res) {
  res.render('main', {
    dataDomain: dataDomain,
    dataConfig: dataConfig
  });
});

io.sockets.on('connection', function (socket) {
  socket.on('subscribe', function (ids) {
    if(typeof(ids) == 'string') ids = [ids];
    
    var reply = [];
    ids.forEach(function(id) {
      socket.join(id);
      var current = dataSource.get(id);
      if(current) {
        reply.push(current);
      }
    });
    if(reply.length) {
      socket.emit("update", reply);
    }
  });
});