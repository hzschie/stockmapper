var dataDomain = process.env.DATA_DOMAIN = process.env.DATA_DOMAIN || 'nyse';

var express = require('express'),
    http = require('http'),
    fs = require('fs'),
    
    dataRoutes = require('./routes/data.js');

// NODE APP CONFIGURATION    
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

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  
  app.use(express['static'](__dirname + '/public'));
  app.use(express.favicon(__dirname + '/public/images/favicon.ico'));
  app.use(app.router);
});


// ASSET PACKAGER CONFIGURATION
var BundleUp = require('bundle-up');
BundleUp(app, __dirname + '/lib/assets', {
  staticRoot: __dirname + '/public/',
  staticUrlRoot:'/',
  bundle: (process.env.BUNDLE && process.env.BUNDLE.toLowerCase() == 'true'),
  minifyCss: true,
  minifyJs: true
});
console.log("process.env = ", process.env);


// DOMAIN SPECIFIC CONFIGURATION
var dataConfig = JSON.stringify(JSON.parse(// Parse and Stringify the data to strip whitespace
  fs.readFileSync(__dirname + '/public/data/' + dataDomain + '/config.json', 'utf8')
));

// STOCK AND GROUP DEFINITION JSON
var groups = fs.readFileSync(__dirname + '/public/data/' + dataDomain + '/groups.json', 'utf8');
var stocks = fs.readFileSync(__dirname + '/public/data/' + dataDomain + '/stocks.json', 'utf8');

// SETUP DYNAMIC DEFINITIONS (WHICH LOAD THE DEFINITIONS INTO MEMORY, AND REGENERATE PERIODICALLY)
if(process.env.DYNAMIC && process.env.DYNAMIC.toLowerCase() == 'true') {
  groups = stocks = null;
  var definitions = require('./build_' + dataDomain + '_definitions');
  definitions.on('update', function(_groups, _stocks) {
    groups = JSON.stringify(_groups);
    stocks = JSON.stringify(_stocks);
  });
  definitions.update();
  // Add a route to enable triggering a refresh
  app.get('/refresh/definitions', definitions.update);
}

// ROUTES
app.get('/series/intraday/:id', dataRoutes.getIntraday);
app.get('/series/5day/:id', dataRoutes.get5day);
app.get('/series/daily/:id', dataRoutes.getDaily);
app.get('/news/:id', dataRoutes.getNews);
app.get('/datasets/:name', dataRoutes.getExtendedDataset);

app.get('/*', function(req, res) {
  if(!groups || !stocks) {
    // In dynamic mode, if the definitions aren't ready, we wait for them.
    var handler = arguments.callee;// This response handler
    definitions.on('update', function() { handler(req, res); });
    return;
  }
  
  var ua = req.headers['user-agent'],
      isTablet = /ipad/i.test(ua) || req.query.tablet || false,
      isMobile = !isTablet && (/mobile/i.test(ua) || req.query.mobile || false);
      
  res.render(dataDomain, {
    dataDomain: dataDomain,
    dataConfig: dataConfig,
    groups: groups,
    stocks: stocks,
    isTablet: isTablet,
    isMobile: isMobile
  });
});
