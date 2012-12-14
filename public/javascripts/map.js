(function() {
  mapper.Map = Map;
  
  function Map($map, _models) {
    this.$container = $map;
    _.extend(this, Backbone.Events);
    var models,
        $shadows = $(document.createElement('div')).addClass('shadows').appendTo($map),
        $labels = $(document.createElement('div')).addClass('labels').appendTo($map),
        grid = null,
        clusterCategories = {},
        _this = this,
        getTagHtml = mapper.config.getMapTagHtml || function(model) { return model.get('sym'); },
        parentW = $map.parent().width();
        

    $map.mouseout(function(event) { 
      if(event.toElement != $map[0] && !$(event.toElement).is('li')) 
        _this.trigger('inspect_tag', null);
    });

    this.setModels = function(_models, category) {
      if(models) {
        models.off('change', updateModel);
        models.off('reset', rebuild);
      }
      
      models = _models;
      clusterCategories.current = category;
      rebuild(null, null, true);

      // Subscribe to subsequent adding of models
      models.on('change', updateModel);
      models.on('reset', rebuild);
    };
    
    this.clusterBy = function(category, currentCategory) {
      clusterCategories.clusterBy = category;
      rebuild();
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
      if(!models) return;
      var newNumCols = Math.floor(parentW / ($map.children().eq(2).outerWidth() - 1)),
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
        xtraDelay = function(extra) { return function(model, i) { return extra + iDelay(model, i); }; };
    function rebuild(collection, options, isNewCollection) {
      var tt = Date.now();
      
      Interval.remove({ key:'map_create_grid' });
      Interval.callOnce({ fn:function() {
        var oldGrid, oldRows;
        sizeMult = models.length > 1000 ? 2 : 1;
        if(grid) {
          oldCells = grid.cellsClone();
          oldRows = grid.rows;
          updateBounds();
        }
        else {
          var $tag = $('<li class="tag"> </li>').appendTo($map);
          grid = new mapper.Grid(models.length, parentW, $tag.outerWidth() - 1, $tag.outerHeight() - 1, makeClusters, true);
          // grid = new mapper.Grid(models.length, parentW, $tag.outerWidth() - 1, $tag.outerHeight() - 1, makeCells);
          $tag.remove();
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
            
          var labels = d3.select($labels[0]).selectAll('label').data(grid.groups, function(group) { return group.key + (exiting == oldLength ? group.values.length : ''); });
          labels.enter()
            .append('label')
            .style('visibility', 'hidden')
            .text(function(group) { return group.key || 'Uncatogrized'; })
            .style("left", function (group) { return grid.xi(group.pos) + 'px'; })
            .style("top", function (group) { return grid.yi(group.pos) - 14 + 'px'; })
            .each(function(group) {
              var _this = this;
              setTimeout(function() {
                d3.select(_this).style('visibility', 'visible');
              }, exiting == 0 ? iDelay(null, group.pos) : getDelay(null, group.pos));
            });
          
          Interval.remove({ key:'map_update' });
          Interval.callOnce({ fn:function() {
            _this.search(searched, false);
          
            sizeMult *= .75;
            getDelay = xtraDelay(200);
            tags
              .each(updateModel);

            labels
              .style('display', grid.hideGroups ? 'none' : '')
              .each(function(group) {
                var _this = this;
                setTimeout(function() {
                  d3.select(_this)
                    .style("left", function (group) { return grid.xi(group.pos) + 'px'; })
                    .style("top", function (group) { return grid.yi(group.pos) - 14 + 'px'; });
                }, getDelay(null, group.pos));
              });
            labels.exit().remove();
            
            if(mapper.perf.animate != false && models.length && models.length && models.at(0).get('hasData') && !$map.hasClass('animated')) {
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
      }, key:'map_create_grid' });
    }
    
    function updateBounds() {
      grid.n(models.length);
      var bounds = grid.bounds();
      setTimeout(function() {
        $map.css({ width: bounds.w, height: bounds.h/*, marginLeft:(parentW - bounds.w) / 2*/ });
      }, isNaN(bounds.h) || bounds.h >= $map.height() ? 0 : (getDelay(null, models.length - 1) + 600));
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
      if(n == 0) return [];
      
      var category = new RegExp('^' + clusterCategories.clusterBy + '$', 'i'),
          MISC = 'Uncategorized',
          xGapRatio = uh/uw,
          yGapRatio = 2,
          indexedModels = _.map(models.models, function(model, i) { return { i:i, model:model }; }),
          nesting = d3.nest()
            .key(function(indexedModel) {
              var applicableGroup = _.find(
                indexedModel.model.get('groups'), 
                function(group) {
                  return category.test(group.get('category'));
                }
              );
              
              return applicableGroup ? applicableGroup.get('nickname') : MISC;
            })
            .sortKeys(function(a,b) {
              return a == MISC ? 1 : b == MISC ? -1 : d3.ascending(a,b);
            })
            .entries(indexedModels),

          isSingleGroup = !clusterCategories.clusterBy || category.test(clusterCategories.current);

      if(nesting.length == 0) {
        this.groups = [];
        return [];
      }

      var tree = generateBinTree(nesting);

      var _c = c;
      gridifyBinTree(tree, _c);
      var i = 0;
      while(tree.numCols + (tree.xGaps - 1) * xGapRatio > c) {
        _c -= 1;
        gridifyBinTree(tree, _c);
        i++;
        if(i > 8) break;
      }

      // this.cols = tree.numCols + tree.xGaps * xGapRatio;
      this.rows = tree.numRows + (tree.yGaps + 1) * yGapRatio;
      
      var cells = makeCells(tree);
      this.groups = cells.groups;
      this.hideGroups = isSingleGroup;
      return cells;
      
      function generateBinTree(groups, memo) {
        var memo = memo || {};
        memo.numMembers = d3.sum(groups, function(group) { return group.values.length; });

        if(groups.length == 1) {
          memo.leaf = groups[0];
          // mappedGroups.push({ group:memo.leaf, model:memo.values[0] });
          return memo;
        }
        else memo.branches = [{},{}];

        for(var i = 0, count = 0, split = [[],[]], len = groups.length; i < len; i++) {
          var group = groups[i],
              numMembers = group.values.length;

          // if(count + numMembers/2 <= memo.numMembers / 2 && i != len-1) split[0].push(group);
          if(count + numMembers/2 <= memo.numMembers / 2 && i != len-1) split[0].push(group);
          else split[1].push(group);

          count += numMembers;
        }

        generateBinTree(split[0], memo.branches[0]);
        generateBinTree(split[1], memo.branches[1]);

        return memo;
      }
      
      function gridifyBinTree(_tree, numCols, xGaps, yGaps) {
        _tree.numCols = numCols;//Math.max(3, Math.min(numCols, _tree.numMembers));
        _tree.numRows = Math.ceil(_tree.numMembers / _tree.numCols);
        _tree.xGaps = xGaps || 0;
        _tree.yGaps = yGaps || 0;
        
        var minCols = 3;
        
        if(_tree.leaf) {
          _tree.numCols = Math.max(minCols, Math.min(numCols, _tree.numMembers));
          return;
        }
        
        var f0 = Math.max(minCols, _tree.branches[0].numMembers) / _tree.numMembers,
            f1 = Math.max(minCols, _tree.branches[1].numMembers) / _tree.numMembers,
            fMin = Math.min(f0, f1),
            fMax = Math.max(f0, f1);
        
        var aspect = uw * _tree.numCols / (_tree.numRows * uh),
            bestHorzAspect  = fMax * aspect,
            // worstHorzAspect = fMin * aspect,
            bestVertAspect  = fMax / aspect,
            // worstVertAspect = fMin / aspect,
            numColsIfHorz = Math.round(fMin * _tree.numCols);
        
        if((bestHorzAspect < bestVertAspect) || (numColsIfHorz < minCols) || (numColsIfHorz * uw < 100) ) {
          _tree.stack = VERT;
          gridifyBinTree(_tree.branches[0], _tree.numCols, _tree.xGaps, _tree.yGaps);
          gridifyBinTree(_tree.branches[1], _tree.numCols, _tree.xGaps, _tree.branches[0].yGaps + 1);
          _tree.xGaps = Math.max(_tree.branches[0].xGaps, _tree.branches[1].xGaps);
          _tree.yGaps = _tree.branches[1].yGaps;
          _tree.numCols = Math.max(_tree.branches[0].numCols, _tree.branches[1].numCols);
          _tree.numRows = _tree.branches[0].numRows + _tree.branches[1].numRows;
        }
        else {
          _tree.stack = HORZ;
          gridifyBinTree(_tree.branches[0], Math.round(f0 * _tree.numCols), _tree.xGaps, _tree.yGaps);
          gridifyBinTree(_tree.branches[1], Math.round(f1 * _tree.numCols), _tree.branches[0].xGaps + 1, _tree.yGaps);
          
          // if(_tree.branches[0].yGaps > _tree.branches[1].yGaps) {
          //   gridifyBinTree(_tree.branches[0], _tree.branches[0].numCols + 1, _tree.xGaps, _tree.yGaps);
          //   gridifyBinTree(_tree.branches[1], _tree.branches[1].numCols - 1, _tree.branches[0].xGaps + 1, _tree.yGaps);
          // }
          
          _tree.xGaps = _tree.branches[1].xGaps;
          _tree.yGaps = Math.max(_tree.branches[0].yGaps, _tree.branches[1].yGaps);
          _tree.numCols = _tree.branches[0].numCols + _tree.branches[1].numCols;
          _tree.numRows = Math.max(_tree.branches[0].numRows, _tree.branches[1].numRows);
        }
        return _tree;
      }
      
      function makeCells(_tree, cells, pos0) {
        cells = cells || [];
        cells.groups = cells.groups || [];
        pos0 = pos0 || [0, 0];
        
        if(_tree.leaf) {
          var indexedModels = _tree.leaf.values;
          for(var i = 0; i < _tree.numMembers; i++) {
            cells[indexedModels[i]['i']] = [ pos0[0] + (i % _tree.numCols) + _tree.xGaps * xGapRatio, pos0[1] + Math.floor(i / _tree.numCols) + _tree.yGaps * yGapRatio + (isSingleGroup ? 0 : 1) ];
            // cells[indexedModels[i]['i']] = [ pos0[0] + Math.floor(i / _tree.numRows) + _tree.xGaps * xGapRatio, pos0[1] + (i % _tree.numRows) + _tree.yGaps * yGapRatio + 1 ];
          }
          
          // Mapping between a group (which contains group name) to a position
          _tree.leaf.pos = indexedModels[0]['i'];
          cells.groups.push(_tree.leaf);
          
          return cells;
        }
        
        if(_tree.stack == VERT) {
          makeCells(_tree.branches[0], cells, pos0);
          makeCells(_tree.branches[1], cells, [pos0[0], pos0[1] + _tree.branches[0].numRows]);
        }
        else {
          makeCells(_tree.branches[0], cells, pos0);
          makeCells(_tree.branches[1], cells, [pos0[0] + _tree.branches[0].numCols, pos0[1]]);
        }
        return cells;
      }
    }
  };
})();