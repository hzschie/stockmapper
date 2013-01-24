var dataDomain = process.env.DATA_DOMAIN;
if(!dataDomain) {
  throw new Error('Missing env variable DATA_DOMAIN');
}

var express = require('express'),
    http = require('http'),
    fs = require('fs'),
    
    dataRoutes = require('./routes/data.js');
    loginSupport = /true/i.test(process.env.REQUIRE_LOGIN) ? require('./lib/login_support.js') : null;// Gets require()'ed only if needed

// NODE APP CONFIGURATION    
var app = express(),
    server = http.createServer(app),
    io = null;
    
server.listen(process.env.PORT || 3000);

if(/true/i.test(process.env.WEBSOCKET)) {
  io = require('socket.io').listen(server, {
    'log level': 0,
    'transports': ['xhr-polling'],
    'polling duration': 10,
    'browser client minification': true
  });
  dataRoutes.setIO(io);
}

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');

  app.use(express.compress());
  app.use(express['static'](__dirname + '/public'));
  
  var favicon = __dirname + '/public/images/domains/' + dataDomain + '/favicon.ico';
  app.use(express.favicon(fs.existsSync(favicon) ? favicon : __dirname + '/public/images/favicon.ico'));
  
  if(loginSupport) loginSupport(app);
  
  app.use(app.router);
});


// ASSET PACKAGER CONFIGURATION
var BundleUp = require('bundle-up');
BundleUp(app, __dirname + '/lib/assets', {
  staticRoot: __dirname + '/public/',
  staticUrlRoot:'/',
  bundle: (/true/i.test(process.env.BUNDLE)),
  minifyCss: true,
  minifyJs: true
});
if(/true/i.test(process.env.VERBOSE)) console.log("process.env = ", process.env);


// DOMAIN SPECIFIC CONFIGURATION
var dataConfig = JSON.stringify(JSON.parse(// Parse and Stringify the data to strip whitespace
  fs.readFileSync(__dirname + '/public/data/' + dataDomain + '/config.json', 'utf8')
));

// STOCK AND GROUP DEFINITION JSON
var groups, stocks;

// SETUP DYNAMIC DEFINITIONS (WHICH LOAD THE DEFINITIONS INTO MEMORY, AND REGENERATE PERIODICALLY)
if(/true/i.test(process.env.DYNAMIC)) {
  var definitions = require('./build_definitions');
  definitions.on('update', function(data) {
    groups = JSON.stringify(data.groups);
    stocks = JSON.stringify(data.stocks);
  });
  definitions.update();
  
  // Add a route to enable triggering a refresh
  app.get('/refresh/definitions', definitions.update);
}
else {
  groups = fs.readFileSync(__dirname + '/public/data/' + dataDomain + '/groups.json', 'utf8');
  stocks = fs.readFileSync(__dirname + '/public/data/' + dataDomain + '/stocks.json', 'utf8');
}

// ROUTES
app.get('/datasets/:name', dataRoutes.getDataset);
app.get('/series/:id', dataRoutes.getTimeSeries);
app.get('/news/:id', dataRoutes.getNews);

app.get('/scratchpad', function(req, res) {
  res.render('scratchpad', {
    groups: groups,
    stocks: stocks
  });
});

try {
  // Load domain specific routes, if exit
  var domainSpecificRoutes = require(__dirname + '/lib/domains/' + process.env.DATA_DOMAIN + '/routes.js')(app);
}
catch (e) {
  // No problem
}

var mainRouteArgs = ['/*'];
if(loginSupport) mainRouteArgs.push(loginSupport.ensureAuthenticated);
mainRouteArgs.push(
  function(req, res) {
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
      isMobile: isMobile,
      useWebSocket: io != null,
      analyticsCode: process.env.ANALYTICS_CODE
    });
  }
);
app.get.apply(app, mainRouteArgs);
