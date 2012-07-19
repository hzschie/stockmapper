var path = require('path');
module.exports = function(assets) {
  assets.root = __dirname + '/../public';

  /* JavaScripts */
  assets.addJs('/javascripts/lib/jquery.history.js');
  assets.addJs('/javascripts/lib/underscore-min.js');
  assets.addJs('/javascripts/lib/backbone-min.js');
  assets.addJs('/javascripts/lib/d3.v2.min.js');
  
  assets.addJs('/javascripts/utils.js');
  assets.addJs('/javascripts/stocks.js');
  assets.addJs('/javascripts/viewstate.js');
  assets.addJs('/javascripts/panel.js');
  assets.addJs('/javascripts/map.js');
  assets.addJs('/javascripts/chart.js');
  assets.addJs('/javascripts/inspector.js');
  assets.addJs('/javascripts/main.js');

  // Add domain-specific js file, if exists
  if(process.env.DATA_DOMAIN) {
    var jsPath = '/javascripts/domains/' + process.env.DATA_DOMAIN + '.js';
    if(path.existsSync(assets.root + jsPath)) {
      assets.addJs(jsPath);
    }
  }

  /* Stylesheets */
  assets.addCss('/stylesheets/boilerplate.css');
  assets.addCss('/stylesheets/main.css');
  assets.addCss('/stylesheets/panel.css');
  assets.addCss('/stylesheets/map.css');
  assets.addCss('/stylesheets/inspector.css');

  // Add domain-specific css file, if exists
  if(process.env.DATA_DOMAIN) {
    var cssPath = '/stylesheets/domains/' + process.env.DATA_DOMAIN + '.css';
    if(path.existsSync(assets.root + cssPath)) {
      assets.addCss(cssPath);
    }
  }
};