var fs = require('fs');
module.exports = function(assets) {
  assets.root = __dirname + '/../public';

  /* JavaScripts */
  assets.addJs('/javascripts/lib/jquery.history.js');
  assets.addJs('/javascripts/lib/underscore-min.js');
  assets.addJs('/javascripts/lib/backbone-min.js');
  assets.addJs('/javascripts/lib/d3.v2.min.js');

  // Add domain-specific js file, if exists
  if(process.env.DATA_DOMAIN) {
    var jsPath = '/javascripts/domains/' + process.env.DATA_DOMAIN + '.js';
    if(fs.existsSync(assets.root + jsPath)) {
      assets.addJs(jsPath);
    }
  }
  
  // Mobile only
  assets.addJs('/javascripts/groups_view.js');
  assets.addJs('/javascripts/mobile.js');
  
  assets.addJs('/javascripts/interval.js');
  assets.addJs('/javascripts/utils.js');
  assets.addJs('/javascripts/time_series.js');
  assets.addJs('/javascripts/stocks.js');
  assets.addJs('/javascripts/viewstate.js');
  assets.addJs('/javascripts/panel.js');
  assets.addJs('/javascripts/map.js');
  assets.addJs('/javascripts/chart.js');
  assets.addJs('/javascripts/html_chart.js');
  assets.addJs('/javascripts/graph.js');
  assets.addJs('/javascripts/graph_ui.js');
  assets.addJs('/javascripts/details.js');
  assets.addJs('/javascripts/news.js');
  assets.addJs('/javascripts/inspector.js');
  assets.addJs('/javascripts/layout.js');
  assets.addJs('/javascripts/init_data.js');
  assets.addJs('/javascripts/main.js');

  /* Stylesheets */
  assets.addCss('/stylesheets/boilerplate.css');
  assets.addCss('/stylesheets/main.css');
  assets.addCss('/stylesheets/panel.css');
  assets.addCss('/stylesheets/chart.css');
  assets.addCss('/stylesheets/map.css');
  assets.addCss('/stylesheets/details.css');
  assets.addCss('/stylesheets/graph.css');
  assets.addCss('/stylesheets/news.css');
  assets.addCss('/stylesheets/inspector.css');
  
  // Mobile only
  assets.addCss('/stylesheets/groups_view.css');
  assets.addCss('/stylesheets/mobile.css');

  // Add domain-specific css file, if exists
  if(process.env.DATA_DOMAIN) {
    var cssPath = '/stylesheets/domains/' + process.env.DATA_DOMAIN + '.css';
    if(fs.existsSync(assets.root + cssPath)) {
      assets.addCss(cssPath);
    }
  }
};