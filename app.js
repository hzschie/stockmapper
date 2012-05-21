var express = require('express'),
    http = require('http');
    
var app = express(),
    server = http.createServer(app),
    io = require('socket.io').listen(server, {
      // 'log level': 0,
      'transports': ['xhr-polling'],
      'polling duration': 10
    });

server.listen(process.env.PORT || 3000);

// Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  
  app.use(express['static'](__dirname + '/public'));
  app.use(app.router);
});

app.get('/*', function(req, res) {
  res.render('main', {
    layout: false
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
var YahooDataSource = require('./yahoo_data_source.js').YahooDataSource;
var dataSource = new YahooDataSource(function(data) {
  io.sockets.emit("update", [data]);
});
