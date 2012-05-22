(function() {
  function Map($map, _models) {
    var models,
        $shadows;

    this.setModels = function(_models) {
      if(models) {
        models.off('add', addModel);
        models.off('change', updateModel);
        models.off('reset', rebuild);
      }
      
      models = _models;
      rebuild(null, null, true);

      // Subscribe to subsequent adding of models
      models.on('add', addModel);
      models.on('change', updateModel);
      models.on('reset', rebuild);
    };
    
    if(_models) this.setModels(_models);
    
    function addModel(model) {
      if(model.get('$tag')) {
        model.get('$tag').appendTo($map);
        model.get('$shadow').appendTo($shadows);
        return;
      }

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
    }
    
    function updateModel(model, force) {
      var $tag = model.get('$tag'),
          $shadow = model.get('$shadow');
      if(model.hasChanged('change') || force) {
        $tag.css({
          // backgroundColor: 'rgb(' + mapper.fractionChangeToHex(Math.min(5, Math.max(-5, model.get('changePct'))) / 5) + ')'
          backgroundColor: mapper.changePctToHex( model.get('changePct') )
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
    
    function rebuild(collection, options, isNewCollection) {
      var tt = Date.now();
      $map.empty();
      $shadows = $(document.createElement('div')).addClass('shadows').appendTo($map);
      
      models.forEach(function(model) {
        addModel(model);
        if(isNewCollection && model.get('hasData')) {
          updateModel(model, true);
        }
      });
      console.log(Date.now() - tt + ' ms, MAP redraw');
    }
  };
  
  mapper.Map = Map;
})();