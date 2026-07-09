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
// Commented out for compatibility with modern Node.js
// require('coffee-script');
// var BundleUp = require('bundle-up');
// BundleUp(app, __dirname + '/lib/assets', {
//   staticRoot: __dirname + '/public/',
//   staticUrlRoot:'/',
//   bundle: (/true/i.test(process.env.BUNDLE)),
//   minifyCss: true,
//   minifyJs: true
// });

// Simple replacements for bundle-up functions
var assetsList = require('./lib/assets');
var mockAssets = {
  root: __dirname + '/public',
  css: [],
  js: [],
  addCss: function(path) { this.css.push(path); },
  addJs: function(path) { this.js.push(path); }
};
assetsList(mockAssets);

app.locals.renderStyles = function() {
  return mockAssets.css.map(function(path) {
    return '<link rel="stylesheet" href="' + path + '">';
  }).join('\n    ');
};

app.locals.renderJs = function() {
  return mockAssets.js.map(function(path) {
    return '<script src="' + path + '"></script>';
  }).join('\n    ');
};

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
    app.groups = JSON.stringify(data.groups);
    app.stocks = JSON.stringify(data.stocks);
  });
  definitions.update();
  
  // Add a route to enable triggering a refresh
  app.get('/refresh/definitions', definitions.update);
}
else {
  app.groups = groups = fs.readFileSync(__dirname + '/public/data/' + dataDomain + '/groups.json', 'utf8');
  app.stocks = stocks = fs.readFileSync(__dirname + '/public/data/' + dataDomain + '/stocks.json', 'utf8');
}

// ROUTES
app.get('/datasets/:name', dataRoutes.getDataset);
app.get('/series/:id', dataRoutes.getTimeSeries);
app.get('/news/:id', dataRoutes.getNews);

// Diagnostic endpoint to check file existence
app.get('/diagnostic/files', function(req, res) {
  var fs = require('fs');
  var path = require('path');
  
  var checks = [
    '/public/javascripts/lib/backbone-min.js',
    '/public/javascripts/lib/d3.v2.min.js',
    '/public/javascripts/stocks.js',
    '/public/stylesheets/main.css'
  ];
  
  var results = checks.map(function(file) {
    var fullPath = __dirname + file;
    return {
      path: file,
      exists: fs.existsSync(fullPath),
      fullPath: fullPath
    };
  });
  
  res.json({
    __dirname: __dirname,
    cwd: process.cwd(),
    files: results
  });
});

// TEMP PROMO ROUTE - COMMENTED OUT FOR SECURITY
// Contains hardcoded API keys - use environment variables in production
/*
var request = require('request');
app.post('/promo/smp', express.bodyParser(), function(req, res) {
  let { email, feedback, PRICE, IMPRESSION, GID, GNUM } = req.body;

  var mailchimpListId = process.env.MAILCHIMP_LIST_ID;
  var mailchimpApiKey = process.env.MAILCHIMP_API_KEY;
  var mailchimpDataCenter = mailchimpApiKey.split('-')[1];
  var mailchimpSubscribeUrl = [
    'http://',
    mailchimpDataCenter,
    '.api.mailchimp.com/3.0/lists/',
    mailchimpListId,
    '/members/'
  ].join('');

  var subscription = {
    email_address: email,
    status: 'subscribed',
    merge_fields: { PRICE, IMPRESSION, GID, GNUM }
  }

  // Add feedback if present. Need to split it into
  // merge_fields with FEEDBACK1 thru 8, to avoid
  // exceeding the field's size (chunkLen)
  if (typeof feedback === 'string') {
    var chunkLen = 250;
    var numChunks = 1;
    var maxChunks = 8;

    if (feedback.length > chunkLen * maxChunks) {
      res.status(400);
      res.end('Sorry, but your feedback message exceeded the allowed length.');

      return
    }

    while (feedback.length > 0 && numChunks <= maxChunks) {
      subscription.merge_fields['FEEDBACK' + numChunks] = feedback.substr(0, chunkLen);
      feedback = feedback.substr(chunkLen)
      numChunks += 1;
    }
  }

  request.post({
    url: mailchimpSubscribeUrl,
    body: JSON.stringify(subscription),
    headers: {
      'Authorization': 'apikey ' + mailchimpApiKey,
      'Content-Type': 'application/json'
    }
  },
  function(err, response, body) {
    var result = JSON.parse(body)
    if (result.status === 'subscribed') {
      res.status(200);
      res.end('The e-mail address ' + email + ' has been submitted. Thanks for you interest!');
    }
    else {
      if (err) { console.log('Unexpected error:', err); }
      var message = err || result.detail;
      if (message.indexOf(' API ') > -1) {
        message = 'There was an error.'
      }
      message = (message + ' ').split('. ')[0] + '.'


      console.log('err', err);
      console.log('result', result);

      res.status(400);
      res.end(message);
    }
  })
})
*/

app.get('/scratchpad', function(req, res) {
  res.render('scratchpad', {
    groups: groups,
    stocks: stocks
  });
});

try {
  // Load domain specific routes, if exist
  var domainSpecificRoutes = require(__dirname + '/lib/domains/' + process.env.DATA_DOMAIN + '/routes.js')(app, loginSupport);
}
catch (e) {
  if(e.code == 'MODULE_NOT_FOUND') {
    // no problem
  }
  else {
    throw e;
  }
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
