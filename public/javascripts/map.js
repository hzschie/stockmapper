(function() {
  function Map($map, _models) {
    _.extend(this, Backbone.Events);
    var models,
        $shadows = $(document.createElement('div')).addClass('shadows').appendTo($map),
        grid = null,
        _this = this,
        getTagHtml = mapper.config.getTagHtml || function(model) { return model.get('sym'); };
        

    $map.mouseout(function(event) { 
      if(event.toElement != $map[0] && !$(event.toElement).is('li')) 
        _this.trigger('inspect_tag', null);
    });

    this.setModels = function(_models) {
      if(models) {
        models.off('change', updateModel);
        models.off('reset', rebuild);
      }
      
      models = _models;
      rebuild(null, null, true);

      // Subscribe to subsequent adding of models
      models.on('change', updateModel);
      models.on('reset', rebuild);
    };
    
    if(_models) this.setModels(_models);
    
    function addModel(model, i, animate) {
      var $tag = $(this);
      model.$tag = $tag;
      $tag.html(getTagHtml(model));
      
      var $shadow = $(document.createElement('div')).appendTo($shadows);
      model.$shadow = $shadow;
      
      if(!grid) {
        grid = gg = new mapper.Grid(models.length, $map.width(), $tag.outerWidth() + 1, $tag.outerHeight() + 1);
        updateBounds();
      }
      
      var pos = {
        left: grid.xi(i),
        top: grid.yi(i),
        display:'none'
      };
      $tag.css(pos);
      $shadow.css(pos);
      
      setTimeout(function() {
        $tag.css({ display:'' });
        $shadow.css({ display:'' });
      }, getDelay(model, i));
      
      $tag.mouseover(function() {
        _this.trigger('inspect_tag', model, $tag);
      });
    }
    
    function updateModel(model, i) {
      var force = !isNaN(i);// isNewCollection && model.get('hasData')
      if(force) model.index = i;
      
      var $tag = model.$tag,
          $shadow = model.$shadow;
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
      
      if(!force) return;
      var pos = { 
        left: grid.xi(i),
        top: grid.yi(i)
      };
      setTimeout(function() {
        $tag.css(pos);
        $shadow.css(pos);
      }, getDelay(model, i));
    }
    
    var getDelay,
        iDelay = function(model, i) { return (grid.c(i) + grid.r(i) / grid.rows) * 20; },
        xtraDelay = function(extra) { return function(model, i) { return extra + iDelay(model, i); }; };// slow device, make delay 1 sec longer
    function rebuild(collection, options, isNewCollection) {
      var tt = Date.now();
      
      var oldGrid, oldRows;
      if(grid) {
        oldCells = grid.cellsClone();
        oldRows = grid.rows;
        updateBounds();
      }
      var tags = d3.select($map[0]).selectAll('li'),
          oldLength = tags[0].length;
      tags = tags.data(models.models, models.modelId);
      
      var exiting = 0; tags.exit().each(function() { exiting++; });
      if(exiting == oldLength) {
        getDelay = xtraDelay( 200 + (oldLength - exiting) * 2);
      }
      else {
        getDelay = xtraDelay( 1000 + (oldLength - exiting) * 2);
      }
      tags.enter()
        .append('li')
        .each(addModel);
        
      getDelay = xtraDelay( 200);
      tags
        .each(updateModel);
      
      tags.exit()
        .each(function(model, i) {
          setTimeout(function() {
            model.$tag.remove();
            model.$shadow.remove();
          }, (oldCells[model.index][0] + oldCells[model.index][1] / oldRows) * 20);
        });
        
      console.log(Date.now() - tt + ' ms, MAP redraw');
    }
    
    function updateBounds() {
      grid.n(models.length);
      var bounds = grid.bounds();
      $map.css({ width: bounds.w, height: bounds.h });
    }
  };
  
  mapper.Map = Map;
})();