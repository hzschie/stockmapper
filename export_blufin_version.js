var fs = require('fs'),
    cp = require('child_process'),
    flow = require('nimble'),
    BundleUp = require('bundle-up');

var destination = 'export';
destination = __dirname + '/temp/' + destination.replace(/\/+/, '/');
// var destination = __dirname + '/../blufin_stockmapper/';

flow.series([prepareDestination, cpContent, bundlePublic, rmNonBundled, prepareJade, cpJQuery, bakeEnv, removeBundler]);

function prepareDestination(callback) {
  try {
    fs.statSync(destination);
  }
  catch (err) {
    console.log('Creating directory: ' + destination);
    fs.mkdirSync(destination);
  }
  
  cp.exec(
    'rm -rf ' + destination + '/*',
    cpHandler(callback)
  );
}

function cpContent(callback) {
  var copied = [
    'app.js',
    'build_definitions.js',
    'lib',
    'package.json',
    'Procfile',
    'public',
    'routes',
    'views'
  ];
  flow.series(
    copied.map(function(filenameOrDirectory) {
      return function(cpcb) {
        var cmd = 'cp -R ' + filenameOrDirectory + ' ' + destination;
        console.log(cmd);
        cp.exec(cmd, cpHandler(cpcb));
      };
    }),
    callback
  );
}

function bundlePublic(callback) {
  var assets = destination + '/lib/assets',
      bundleDestination = destination + '/public/';
  console.log('Bundling ' + assets + ' into ' + bundleDestination);
  process.env.DATA_DOMAIN = 'blufin';
  BundleUp({ locals: function() {} }, assets, {
    staticRoot: bundleDestination,
    staticUrlRoot:'/',
    bundle: true,
    minifyCss: true,
    minifyJs: true
  });
  callback();
}

function rmNonBundled(callback) {
  var removed = [
    'public/javascripts',
    'public/stylesheets',
    'public/images/psd',
    'public/images/domains',// CAUTION: might cause deletion of blufin stuff in future
    
    'public/data/nyse',
    'public/data/foreside',
    'views/nyse.jade',
    'views/foreside.jade',
    'views/domains',// CAUTION: might cause deletion of blufin stuff in future
    'lib/domains/foreside',
    'lib/domains/nyse',
    'lib/yahoo_data_source.js',
    'lib/login_support.js',
    'lib/assets.js'
  ];
  flow.series(
    removed.map(function(filenameOrDirectory) {
      return function(cpcb) {
        var cmd = 'rm -rf ' + destination + '/' + filenameOrDirectory;
        console.log(cmd);
        cp.exec(cmd, cpHandler(cpcb));
      };
    }),
    callback
  );
}

function prepareJade(callback) {
  var listing = fs.readdirSync(destination + '/public/generated/bundle'),
      bundledJs = listing.filter(function(bundle) { return (/\.js$/).test(bundle); }),
      bundledCss = listing.filter(function(bundle) { return (/\.css$/).test(bundle); }),
      view = destination + '/views/main.jade',
      content = fs.readFileSync(view, 'utf8');
  
  console.log('embedding ' + bundledCss + ' and ' + bundledJs);
  content = content.replace(/\!\= renderStyles\(\)/, 'link(rel="stylesheet", href="/generated/bundle/' + bundledCss + '")');
  content = content.replace(/\!\= renderJs\(\)/, 'script(type="text/javascript", src="/generated/bundle/' + bundledJs + '")');
  
  fs.writeFileSync(view, content, 'utf8');
  
  callback();
}

function cpJQuery(callback) {
  var libDir = destination + '/public/javascripts';
  fs.mkdirSync(libDir);
  libDir += '/lib';
  fs.mkdirSync(libDir);
  var cmd = 'cp -R ' + './public/javascripts/lib/jquery-*' + ' ' + libDir;
  console.log(cmd);
  cp.exec(cmd, cpHandler(callback));
}

// curry a standard callback function used for child processes and nimble
function cpHandler(callback) {
  return function(err, stdout, stderr) {
    if(err) {
      console.log('ERROR:', err.message, '\n' + stderr);
      return callback(err);
    }
    console.log(stdout);
    callback();
  };
}

function bakeEnv(callback) {
  var appFile = destination + '/app.js',
      appJs = fs.readFileSync(appFile, 'utf8'),
      env = [
        'process.env.DATA_DOMAIN = "blufin";',
        'process.env.DYNAMIC = true;'
      ].join('\n');
  console.log('Append to ' + appFile + ':');
  console.log(env);
  fs.writeFileSync(appFile, env + '\n' + appJs, 'utf8');
  
  callback();
}

function removeBundler(callback) {
  var appFile = destination + '/app.js',
      appJs = fs.readFileSync(appFile, 'utf8');
  
  console.log('removing bundler code');
  
  var split = appJs.split('\n'),
      iBundle = -1, iBundle0, iBundle1;
  for(var i=0; i < split.length; i++) {
    if(/var BundleUp \= /.test(split[i])) {
      iBundle = i;
      break;
    }
  }
  if(iBundle > -1) {
    iBundle0 = iBundle;
    while(++iBundle < split.length) {
      if((/\);/).test(split[iBundle])) {
        iBundle1 = iBundle;
        break;
      }
    }
    split.splice(iBundle0, iBundle1 - iBundle0 + 1);
    
    appJs = split.join('\n');
  }
  
  fs.writeFileSync(appFile, appJs, 'utf8');
  
  callback();
}


// uglify = require('./node_modules/bundle-up/node_modules/uglify-js');
// var js = fs.readFileSync('./lib/blufin_data_source.js', 'utf8');
// console.log(uglify(js));