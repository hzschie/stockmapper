var fs = require('fs');
module.exports = function(assets) {
  assets.root = __dirname + '/../public';

  /* JavaScripts */
  assets.addJs('/javascripts/lib/jquery.history.js');
  assets.addJs('/javascripts/lib/underscore-min.js');
  assets.addJs('/javascripts/lib/backbone-min.js');
  assets.addJs('/javascripts/lib/backbone.localStorage.js');
  assets.addJs('/javascripts/lib/d3.v2.min.js');

  // Add domain-specific js file, if exists
  if(process.env.DATA_DOMAIN) {
    var jsPath = '/javascripts/domains/' + process.env.DATA_DOMAIN + '.js';
    if(fs.existsSync(assets.root + jsPath)) {
      assets.addJs(jsPath);
    }
  }
  
  assets.addJs('/javascripts/interval.js');
  assets.addJs('/javascripts/utils.js');
  assets.addJs('/javascripts/time_series.js');
  assets.addJs('/javascripts/stocks.js');
  assets.addJs('/javascripts/models/behaviors.js');
  assets.addJs('/javascripts/viewstate.js');
  assets.addJs('/javascripts/slider.js');
  assets.addJs('/javascripts/ui/dropdown_selector.js');
  assets.addJs('/javascripts/widget_panel.js');
  assets.addJs('/javascripts/selector_buttons.js');
  assets.addJs('/javascripts/global_last_update.js');
  assets.addJs('/javascripts/groups_view.js');
  assets.addJs('/javascripts/map/map_lite.js');
  assets.addJs('/javascripts/map.js');
  assets.addJs('/javascripts/map_ui.js');
  assets.addJs('/javascripts/html_chart.js');
  assets.addJs('/javascripts/graph.js');
  assets.addJs('/javascripts/graph_ui.js');
  assets.addJs('/javascripts/views/graph/micrograph.js');
  assets.addJs('/javascripts/search.js');
  assets.addJs('/javascripts/details.js');
  assets.addJs('/javascripts/news.js');
  assets.addJs('/javascripts/views/news_ticker.js');
  assets.addJs('/javascripts/views/news_scroller.js');
  assets.addJs('/javascripts/views/portfolio.js');
  assets.addJs('/javascripts/inspector.js');
  assets.addJs('/javascripts/layout.js');
  assets.addJs('/javascripts/init_data.js');
  assets.addJs('/javascripts/controllers/surface.js');
  assets.addJs('/javascripts/main.js');
  
  // Mobile only
  assets.addJs('/javascripts/group_info.js');
  assets.addJs('/javascripts/mobile.js');

  /* Stylesheets */
  assets.addCss('/stylesheets/boilerplate.css');
  assets.addCss('/stylesheets/main.css');
  assets.addCss('/stylesheets/ui.css');
  assets.addCss('/stylesheets/slider.css');
  assets.addCss('/stylesheets/chart.css');
  assets.addCss('/stylesheets/groups_view.css');
  assets.addCss('/stylesheets/clustering.css');
  assets.addCss('/stylesheets/map.css');
  assets.addCss('/stylesheets/map_ui.css');
  assets.addCss('/stylesheets/details.css');
  assets.addCss('/stylesheets/search.css');
  assets.addCss('/stylesheets/graph.css');
  assets.addCss('/stylesheets/news.css');
  assets.addCss('/stylesheets/inspector.css');
  assets.addCss('/stylesheets/portfolio.css');
  
  // Mobile only
  assets.addCss('/stylesheets/mobile.css');

  // Add domain-specific css file, if exists
  if(process.env.DATA_DOMAIN) {
    var cssPath = '/stylesheets/domains/' + process.env.DATA_DOMAIN + '.css';
    if(fs.existsSync(assets.root + cssPath)) {
      assets.addCss(cssPath);
    }
  }
};