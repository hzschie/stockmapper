(function() {
  function Map($map, _models) {
    var models,
        $shadows;

    (this.setModels = function(_models) {
      if(models) {
        models.off('add', addModel);
        models.off('change', updateModel);
        $map.empty();
      }
      
      $shadows = $(document.createElement('div')).addClass('shadows').appendTo($map);
      models = _models;

      // If models is already populated (may be partially), we handle those models now
      models.forEach(function(model) {
        addModel(model);
        updateModel(model, true);
      });
      // Subscribe to subsequent adding of models
      models.on('add', addModel);
      models.on('change', updateModel);
    })(_models);
    
    function addModel(model) {
      var sym = model.get('sym'),
          html;
      if(sym.indexOf('-') > -1) {
        var splt = sym.split('-');
        html = splt[0] + '<span>' + splt[1] + '</span>';
      } else {
        html = sym;
      }
      
      model.set({
        $tag: $(document.createElement('li')).html(html).appendTo($map),
        $shadow: $(document.createElement('div')).appendTo($shadows)
      }, { silent:true });
      // model.on('change', updateModel);
    }
    
    function updateModel(model, force) {
      var $tag = model.get('$tag'),
          $shadow = model.get('$shadow');
      if(model.hasChanged('change') || force) {
        $tag.css({
          backgroundColor: 'rgb(' + mapper.fractionChangeToHex(Math.min(5, Math.max(-5, model.get('changePct'))) / 5) + ')'
        });
      }
      if(model.hasChanged('isVeryActive') || force) {
        if(model.get('isVeryActive')) {
          $tag.addClass('active');
          $shadow.addClass('active');
        }
        else {
          $tag.removeClass('active');
          $shadow.removeClass('active');
        }
      }
    }
  };
  
  mapper.Map = Map;
})();