// See performance tests: http://jsfiddle.net/qkAUH/3/
(function() {
  var getMapTagHtml = mapper.config.getMapTagHtml;
  mapper.MapLite = function($container) {
    var models;
    
    function render() {
      $container.html($.map(models, getTagHtml).join(''));
    }
    
    function getTagHtml(model) {
      var inner = getMapTagHtml ? getMapTagHtml(model) : model.get('sym');
      return '<li style="' + getCss(model) + '" >' + inner + '</li>';
    }
    
    function getCss(model) {
      return "background:" + mapper.changePctToHex( model.get('changePct') ) + ';';
    }
    
    return {
      setModels: function(_models) {
        models = _models;
        render();
      }
    };
  };
})();