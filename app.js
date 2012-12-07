var dataDomain = process.env.DATA_DOMAIN;
if(!dataDomain) {
  throw new Error('Missing env variable DATA_DOMAIN');
}

var express = require('express'),
    http = require('http'),
    fs = require('fs'),
    
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    
    dataRoutes = require('./routes/data.js');

passport.serializeUser(function(user, done) {
  // console.log('serialize', user.id);
  done(null, user.id);
});
passport.deserializeUser(function(str, done) {
  // console.log('DEserialize', str);
  done(null, { id: str });
});
passport.use(new LocalStrategy(
  function(username, password, done) {
    if(password) {
      password = password.toLowerCase();
      if(['foreside', 'cnbc', 'state street', '2n'].indexOf(password) > -1) {
        console.log('LOG IN: ' + password);
        done(null, { id: password });
      }
      else {
        console.log('FAILED ATTEMP: ' + password);
        done(null, false, { message: 'Invalid password' });
      }
    }
    // process.nextTick(function () {
    //   done(null, { id: password });
    // });
    // if (err) { return done(err); }
    // if (!user) { return done(null, false, { message: 'Unknown user ' + username }); }
    // if (user.password != password) { return done(null, false, { message: 'Invalid password' }); }
    // return done(null, user);
  }
));

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

  app.use(express['static'](__dirname + '/public'));
  app.use(express.favicon(__dirname + '/public/images/favicon.ico'));
  
  app.use('/', express.cookieParser());
  app.use('/', express.bodyParser());
  app.use('/', express.session({ secret: 'keyboard cat' }));
  app.use('/', passport.initialize());
  app.use('/', passport.session());
  
  app.use(app.router);
});


// ASSET PACKAGER CONFIGURATION
var BundleUp = require('bundle-up');
BundleUp(app, __dirname + '/lib/assets', {
  staticRoot: __dirname + '/public/',
  staticUrlRoot:'/',
  bundle: (/true/i.test(process.env.BUNDLE)),
  minifyCss: false,//true,
  minifyJs: false//true
});
if(/true/i.test(process.env.VERBOSE)) console.log("process.env = ", process.env);


// DOMAIN SPECIFIC CONFIGURATION
var dataConfig = JSON.stringify(JSON.parse(// Parse and Stringify the data to strip whitespace
  fs.readFileSync(__dirname + '/public/data/' + dataDomain + '/config.json', 'utf8')
));

// STOCK AND GROUP DEFINITION JSON
var groups = fs.readFileSync(__dirname + '/public/data/' + dataDomain + '/groups.json', 'utf8');
var stocks = fs.readFileSync(__dirname + '/public/data/' + dataDomain + '/stocks.json', 'utf8');

// SETUP DYNAMIC DEFINITIONS (WHICH LOAD THE DEFINITIONS INTO MEMORY, AND REGENERATE PERIODICALLY)
if(/true/i.test(process.env.DYNAMIC)) {
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
app.get('/datasets/:name', dataRoutes.getDataset);
app.get('/series/:id', dataRoutes.getTimeSeries);
app.get('/news/:id', dataRoutes.getNews);

app.get('/scratchpad', function(req, res) {
  res.render('scratchpad', {
    groups: groups,
    stocks: stocks
  });
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login');
}

app.get('/login', function(req, res) {
  res.render('domains/' + dataDomain + '/login', {
    analyticsCode: process.env.ANALYTICS_CODE
  });
});


app.post('/login',
  passport.authenticate('local', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  }
);
  
app.get('/*', ensureAuthenticated, function(req, res) {
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
});
