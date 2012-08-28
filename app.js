var dataDomain = process.env.DATA_DOMAIN = process.env.DATA_DOMAIN || 'nyse';

var express = require('express'),
    http = require('http'),
    fs = require('fs'),
    
    dataRoutes = require('./routes/data.js');
    
var app = express(),
    server = http.createServer(app),
    io = require('socket.io').listen(server, {
      'log level': 0,
      'transports': ['xhr-polling'],
      'polling duration': 10,
      'browser client minification': true
    });

server.listen(process.env.PORT || 3000);
dataRoutes.setIO(io);

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

// Parse and Stringify the data to strip whitespace
var dataConfig = JSON.stringify(JSON.parse(
  fs.readFileSync(__dirname + '/public/data/' + dataDomain + '/config.json', 'utf8')
));

app.get('/series/intraday/:id', dataRoutes.getIntraday);
app.get('/series/5day/:id', dataRoutes.get5day);
app.get('/series/daily/:id', dataRoutes.getDaily);
app.get('/news/:id', dataRoutes.getNews);

app.get('/*', function(req, res) {
  var ua = req.headers['user-agent'],
      isMobile = /mobile/i.test(ua) || req.query.mobile || false;
      
  res.render(dataDomain, {
    dataDomain: dataDomain,
    dataConfig: dataConfig,
    isMobile: isMobile
  });
});
