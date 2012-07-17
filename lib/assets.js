module.exports = function(assets) {
  assets.root = __dirname + '/../public';

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
    
  assets.addCss('/stylesheets/boilerplate.css');
  assets.addCss('/stylesheets/main.css');
  assets.addCss('/stylesheets/panel.css');
  assets.addCss('/stylesheets/map.css');
  assets.addCss('/stylesheets/inspector.css');
};