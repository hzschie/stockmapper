var express = require('express'),
    io = require('socket.io');

app = express.createServer();
io = io.listen(app);
// Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  
  this.use(require("stylus").middleware({
    src: __dirname + "/public",
    compress: true
  }));
  
  app.use(express.methodOverride());
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({ secret:'mappermapper' }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.listen(process.env.PORT || 3000);

app.get('/main', function(req, res) {
  res.render('main', {
    layout: false
  });
});

io.sockets.on('connection', function (socket) {
  socket.on('subscribe', function (ids) {
    if(typeof(ids) == 'string') ids = [ids];
    
    ids.forEach(function(id) {
      socket.join(id);
      var current = dataSource.get(id);
      if(current) {
        socket.emit("update", current)
      }
    });
  });
});
var YahooDataSource = require('./yahoo_data_source.js').YahooDataSource;
var dataSource = new YahooDataSource(function(data) {
  io.sockets.emit("update", data);
});
