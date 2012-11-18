// See performance tests: http://jsfiddle.net/qkAUH/3/
(function() {
  var getMapTagHtml = mapper.config.getMapTagHtml;
  mapper.MapLite = function($map) {
    var models;
    // Click events
    $map.on('click', function(e) {
      var $tag = $(e.target),
          id = $tag.data('id');
      instance.trigger('select_tag', mapper.models.get(id), $tag);
    });
    // Rollover event
    $map.on('mouseover', function(e) {
      var $tag = $(e.target),
          id = $tag.data('id');
      
      cancelInspectNull();
      instance.trigger('inspect_tag', mapper.models.get(id), $tag);
    });
    $map.on('mouseout', function(e) {
      triggerInspectNull();
    });
    
    function render() {
      $map.html($.map(models, getTagHtml).join(''));
    }
    
    var inspectNullTimeout;
    function triggerInspectNull() {
      inspectNullTimeout = setTimeout(_triggerInspectNull, 10);
    }
    
    function _triggerInspectNull() {
      inspectNullTimeout = null;
      instance.trigger('inspect_tag', null);
    }
    
    function cancelInspectNull() {
      if(inspectNullTimeout) clearTimeout(inspectNullTimeout);
    }
    
    function getTagHtml(model) {
      var inner = getMapTagHtml ? getMapTagHtml(model) : model.get('id');
      return '<li style="' + getCss(model) + '" data-id="' + model.get('id') + '" >' + inner + '</li>';
    }
    
    function getCss(model) {
      return "background:" + mapper.changePctToHex( model.get('changePct') ) + ';';
    }
    
    var instance = {
      setModels: function(_models) {
        models = _models;
        // _.each(models, function(model) { model
        render();
      },
      
      search: function(model) {
        $('.search_result', $map).removeClass('search_result');
        if(!model || model.constructor == mapper.StockGroup) {
          $map.removeClass('dimmed');
        }
        else {
          $map.addClass('dimmed');
          var $tag = $('li[data-id="' + model.id + '"]', $map);
          if($tag) {
            $tag.addClass('search_result');
          }
        }
      }
    };
    _.extend(instance, Backbone.Events);
    return instance;
  };
})();