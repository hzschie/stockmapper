(function() {
  mapper.Map = Map;
  
  function Map($map, _models) {
    _.extend(this, Backbone.Events);
    var models,
        $shadows = $(document.createElement('div')).addClass('shadows').appendTo($map),
        grid = null,
        _this = this,
        getTagHtml = mapper.config.getMapTagHtml || function(model) { return model.get('sym'); },
        parentW = $map.parent().width();
        

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
    
    var searched;
    this.search = function(model, andInspect) {
      searched = model;
      $('.search_result', $map).removeClass('search_result');
      if(!model || model.constructor == mapper.StockGroup) {
        $map.removeClass('dimmed');
      }
      else {
        $map.addClass('dimmed');
        var $tag = model._map && model._map.$tag;
        if($tag) {
          model._map.$tag.addClass('search_result');
          if(andInspect != false) {
            _this.trigger('inspect_tag', model, $tag);
          }
          return;
        }
      }
      _this.trigger('inspect_tag', null);
    };
    
    this.resize = function(explicitW) {
      parentW = explicitW != null ? explicitW : $map.parent().width();
      var newNumCols = Math.floor(parentW / ($map.children().eq(1).outerWidth() - 1)),
          newNumRows = Math.ceil(models.length / newNumCols);
      grid.redefine(null, newNumCols, newNumRows);
      rebuild();
    };
    
    if(_models) this.setModels(_models);
    
    function addModel(model, i, animate) {
      var $tag = $(this).addClass('tag');
      model._map = {};
      model._map.$tag = $tag;
      $tag.html(getTagHtml(model));
      
      var $shadow = $(document.createElement('div')).appendTo($shadows);
      model._map.$shadow = $shadow;
      
      if(!grid) {
        // grid = new mapper.Grid(models.length, parentW, $tag.outerWidth() - 1, $tag.outerHeight() - 1, makeClusters, true);
        grid = new mapper.Grid(models.length, parentW, $tag.outerWidth() - 1, $tag.outerHeight() - 1, makeCells);
        updateBounds();
      }
      
      var pos = {
        left: grid.xi(i),
        top: grid.yi(i),
        visibility: 'hidden'
      };
      $tag.css(pos);
      $shadow.css(pos);
      
      setTimeout(function() {
        $tag.css({ visibility: 'visible' });
        $shadow.css({ visibility: 'visible' });
        $tag.mouseover(function() {
          _this.trigger('inspect_tag', model, $tag);
        });
        $tag.click(function() {
          _this.trigger('select_tag', model, $tag);
        });
      }, getDelay(model, i));
    }
    
    function updateModel(model, i) {
      if(!model._map) return;
      var force = !isNaN(i),
          $tag = model._map.$tag,
          $shadow = model._map.$shadow;
      if(model.hasChanged('change') || force) {
        $tag.css({
          // backgroundColor: 'rgb(' + mapper.fractionChangeToHex(Math.min(5, Math.max(-5, model.get('changePct'))) / 5) + ')'
          backgroundColor: mapper.changePctToHex( model.get('changePct') )
        });
      }
      if(model.hasChanged('isHighlighted') || force) {
        if(model.get('isHighlighted')) {
          $tag.addClass('highlighted');
          $shadow.addClass('highlighted');
        }
        else {
          $tag.removeClass('highlighted');
          $shadow.removeClass('highlighted');
        }
      }
      
      if(!force) return;
      var pos = {
            left: grid.xi(i),
            top: grid.yi(i)
          },
          _map = model._map;
      
      if(_map.updateTimeout) clearTimeout(_map.updateTimeout);
      _map.updateTimeout = setTimeout(function() {
        _map.updateTimeout = null;
        $tag.css(pos);
        $shadow.css(pos);
        
        if(i == models.length - 1) {
          _this.trigger('transition_done');
        }
      }, getDelay(model, i));
      _map.index = i;
    }
    
    var delayMult = mapper.perf.mapDelayMult,
        sizeMult = 1,
        getDelay,
        iDelay = function(model, i) { return (grid.c(i) + grid.r(i) / grid.rows) * delayMult * sizeMult; },
        xtraDelay = function(extra) { return function(model, i) { return extra + iDelay(model, i); }; };// slow device, make delay 1 sec longer
    function rebuild(collection, options, isNewCollection) {
      var tt = Date.now();
      
      var oldGrid, oldRows;
      sizeMult = models.length > 1000 ? 3 : 1;
      if(grid) {
        oldCells = grid.cellsClone();
        oldRows = grid.rows;
        updateBounds();
      }

      Interval.remove({ key:'map_add' });
      Interval.callOnce({ fn:function() {
        var tags = d3.select($map[0]).selectAll('li.tag'),
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
          
        Interval.remove({ key:'map_update' });
        Interval.callOnce({ fn:function() {
          _this.search(searched, false);
          
          sizeMult *= .75;
          getDelay = xtraDelay(200);
          tags
            .each(updateModel);
            
          if(mapper.perf.animate != false && models.length && models.at(0).get('hasData') && !$map.hasClass('animated')) {
            setTimeout(function() {
              $map.addClass('animated');
            }, 0);
          }
        }, key:'map_update' });
        
        tags.exit()
          .each(function(model, i) {
            var _map = model._map,
                $tag = model._map.$tag,
                $shadow = model._map.$shadow,
                index = model._map.index,
                oldCell = oldCells[index],
                delay = oldCell ? (oldCells[index][0] + oldCells[index][1] / oldRows) * .5 * mapper.perf.mapDelayMult : 0;

            $tag.removeClass('tag');
            setTimeout(function() {
              $tag.remove();
              $shadow.remove();
            }, delay);
            delete model._map;
          });
      }, key:'map_add' });
      // console.log(Date.now() - tt + ' ms, MAP redraw', '\t\t\t');
    }
    
    function updateBounds() {
      grid.n(models.length);
      var bounds = grid.bounds();
      setTimeout(function() {
        $map.css({ width: bounds.w, height: bounds.h, marginLeft:(parentW - bounds.w) / 2 });
      }, bounds.h >= $map.height() ? 0 : getDelay(null, models.length - 1));
    }
    
    function makeCells(n, c, r) {
      var centered = true,
          rotated = true,
          cells = [],
          d = c * r - n,
          _c = 0, _r = 0;
      var adj = Math.min(1, centered ? Math.floor(d/2) : 0);
      for(var i = 0; i < n; i++) {
        cells[i] = [_c, _r];
        if(rotated) {
          _r++;
          if(_r >= r - adj) {
            _r = 0;
            _c++;
            if(centered) {
              adj = _c < d/2 || _c >= c - d/2 ? 1 : 0;
            }
            else {
              adj = 0;//_c >= c - d ? 1 : 0;
            }
          }
        }
        else {
          _c++;
          if(_c == c) {
            _c = 0;
            _r++;
          }
        }
      }
      return cells;
    }
    
    var HORZ = 0, VERT = 1;
    
    function makeClusters(n, c, r, uw, uh) {
      var category = 'Sector',//'Capitisation',//'Industry',//,
          indexedModels = _.map(models.models, function(model, i) { return { i:i, model:model }; }),
          nesting = d3.nest()
            .key(function(indexedModel) {
              var applicableGroup = _.find(
                indexedModel.model.get('groups'), 
                function(group) {
                  return group.get('category') == category;
                }
              );
              
              return applicableGroup && applicableGroup.get('nickname');
            })
            .sortKeys(d3.ascending)
            .entries(indexedModels),
          tree = generateBinTree(nesting);
      
      gridifyBinTree(tree, c-5);
      console.log(tree);
      
      return makeCells(tree);
      
      function generateBinTree(groups, memo) {
        var memo = memo || {};
        memo.numMembers = d3.sum(groups, function(group) { return group.values.length; });
        if(groups.length == 1) return memo.leaf = groups[0];
        else memo.branches = [{},{}];

        for(var i = 0, count = 0, split = [[],[]], len = groups.length; i < len; i++) {
          var group = groups[i],
              numMembers = group.values.length;

          if(count + numMembers/2 <= memo.numMembers / 2) split[0].push(group);
          else split[1].push(group);

          count += numMembers;
        }

        generateBinTree(split[0], memo.branches[0]);
        generateBinTree(split[1], memo.branches[1]);

        return memo;
      }
      
      function gridifyBinTree(tree, numCols) {
        tree.numCols = numCols;
        tree.numRows = Math.ceil(tree.numMembers / tree.numCols);
        
        if(tree.leaf) { return tree.numRows; }
        
        var f0 = tree.branches[0].numMembers / tree.numMembers,
            f1 = tree.branches[1].numMembers / tree.numMembers,
            fMin = Math.min(f0, f1),
            fMax = Math.max(f0, f1);
        
        var aspect = uw * tree.numCols / (tree.numRows * uh),
            bestHorzAspect  = fMax * aspect,
            // worstHorzAspect = fMin * aspect,
            bestVertAspect  = fMax / aspect,
            // worstVertAspect = fMin / aspect,
            numColsIfHorz = Math.round(fMin * tree.numCols);
        
        if((bestHorzAspect < bestVertAspect) || numColsIfHorz < 3) {
          tree.stack = VERT;
          tree.numRows = gridifyBinTree(tree.branches[0], tree.numCols) + gridifyBinTree(tree.branches[1], tree.numCols);
        }
        else {
          tree.stack = HORZ;
          tree.numRows = Math.max( gridifyBinTree(tree.branches[0], Math.round(f0 * tree.numCols)), gridifyBinTree(tree.branches[1], Math.round(f1 * tree.numCols)) );
        }
        return tree.numRows;
      }
      
      function makeCells(tree, cells, pos0) {
        cells = cells || [];
        pos0 = pos0 || [0, 0];
        
        if(tree.leaf) {
          var indexedModels = tree.leaf.values;
          for(var i = 0; i < tree.numMembers; i++) {
            cells[indexedModels[i]['i']] = [ pos0[0] + (i % tree.numCols), pos0[1] + Math.floor(i / tree.numCols) ];
          }
          return;
        }
        
        if(tree.stack == VERT) {
          makeCells(tree.branches[0], cells, pos0);
          makeCells(tree.branches[1], cells, [pos0[0], pos0[1] + tree.branches[0].numRows]);
        }
        else {
          makeCells(tree.branches[0], cells, pos0);
          makeCells(tree.branches[1], cells, [pos0[0] + tree.branches[0].numCols, pos0[1]]);
        }
        return cells;
      }
    }
  };
})();