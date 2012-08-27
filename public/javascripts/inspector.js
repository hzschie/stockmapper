(function() {
  mapper.Inspector = Inspector;
  var Template = mapper.Template;
  Inspector.defaultBindings = {
    group: [
      { $:'.type', field:'type', formatter:function(val) { return 'Stocks by ' + mapper.capitalize(val); } },
      { $:'.label', field:'name' },
      { $:'.num_up', field:'upsAndDowns', formatter:function(counts) { return counts[0]; } },
      { $:'.num_down', field:'upsAndDowns', formatter:function(counts) { return counts[1]; } },
      { $:'.volume_up', field:'volumeUp', formatter:mapper.Template.commaFormat },
      { $:'.volume_down', field:'volumeDown', formatter:mapper.Template.commaFormat },
      { $:'.volume_total', field:'volumeTotal', formatter:mapper.Template.commaFormat }
    ],
    stock: [
      { $:'.name', field:'name' },
      { $:'.sym', field:'sym' },
      { $:'.last_trade', field:'lastTrade', formatter:Template.priceFormat },

      { $:'.change', field:'changeDir', formatter:Template.makeRedOrGreen },
      { $:'.change .amount', field:'change', formatter:Template.changeFormat },
      { $:'.change .percent', field:'changePct', formatter:Template.postfix(Template.changeFormat, '%') },

      { $:'.avg_volume', field:'avgVolume', formatter:Template.commaFormat },
      { $:'.volume', field:'volume', formatter:Template.commaFormat },
      { $:'.market_cap', field:'marketCapString' },

      { $:'.open', field:'open', formatter:Template.priceFormat },
      { $:'.high', field:'high', formatter:Template.priceFormat },
      { $:'.low', field:'low', formatter:Template.priceFormat }
    ]
  };

  function Inspector($container) {
    var $tip = $container.find('svg'),
        $window = $(window),
        pointLeft = false,
        pointUp = false,
        bubbW = null,
        bubbH = null,
        targP = null,
        lastPos = {},
        template = new mapper.Template(
          $.extend(Inspector.defaultBindings, mapper.config.getInspectorBindings(Inspector.defaultBindings))
        );
        
    this.inspectTag = function(model, $tag) {
      if(!model) {
        $container.addClass('hidden');
        return;
      }
      $container.removeClass('hidden');
      
      template.applyBindings('stock', $container, model);
      inspectElement($tag, '.stock', { x:57, y:20 });
    };
    
    this.inspectBar = function(model, $subBar, isVol, yFixed) {
      if(!model) {
        $container.addClass('hidden');
        return;
      }
      $container.removeClass('hidden');
      
      template.applyBindings('stock', $container, model);
      inspectElement($subBar, '.stock', { x:57, y:20, yFixed:yFixed }, isVol);
    };
    
    this.inspectGroup = function(group, $tag) {
      if(!group) {
        $container.addClass('hidden');
        return;
      }
      
      $container.removeClass('hidden');
      
      var type = (mapper.config.getGroupType && mapper.config.getGroupType(group.get('type'), group)) || group.get('type');
      template.applyBindings(type, $container, group);
      inspectElement($tag, '.' + type, { x:20, y:20 });
    };
    
    this.suspendTillDone = function(status) {
      $container.addClass('suspended');
      status.on('transition_done', function() {
        setTimeout(function() {
          $container.removeClass('suspended');
        }, 600);
      });
    };
    
    function inspectElement($tag, contentSelector, spacing, forcePoint) {
      $container.find('.content').removeClass('current');
      $container.find(contentSelector).addClass('current');
      var tagPos = $tag.offset(),
          tagSz = { w:$tag.outerWidth(), h:$tag.outerHeight() },
          bodyWidth = $('body').width(),
          _bubbW = bubbW = $container.width(),
          _bubbH = bubbH = $container.height(),
          _pointLeft = pointLeft = tagPos.left <= bodyWidth / 2,
          _pointUp = pointUp = forcePoint == null ? ((tagPos.top + bubbH + tagSz.h + spacing.y) <= ($window.scrollTop() + $window.height())) : forcePoint,
          offset = {
            x: pointLeft ? tagSz.w + spacing.x : -bubbW + 1 - spacing.x,// 57
            y: pointUp ? tagSz.h + spacing.y : -_bubbH - spacing.y
          },
          pos = {
            left: tagPos.left + offset.x,
            top: spacing.yFixed == null ? tagPos.top + offset.y : spacing.yFixed
          };
      
      tagPos.width = tagSz.w;
      tagPos.height = tagSz.h;
      
      targP = {
        left: tagPos.left + (pointLeft ? tagPos.width : 0),
        top: tagPos.top + (pointUp ? tagPos.height : 0)
      };
      $container.css(pos);
    }
    
    d3.timer(updateTip);
    
    function updateTip() {
      var currP = $container.offset();
      if(!targP || (currP.left == lastPos.left && currP.top == lastPos.top)) return;
      
      var pad = 16,//20,
          ins = 10,// inset / how far is the pivot point from the corner
          diff = {
            x: currP.left - targP.left,
            y: currP.top - targP.top
          },
          datum = {
            x: pointLeft ? 0 : bubbW,
            y: pointUp ? 0 : bubbH
          };
      
      $tip.attr({
        width: Math.abs(diff.x + datum.x) + 2*pad,
        height: Math.abs(diff.y + datum.y) + 2*pad
      });
      $tip.css({
        left: Math.min(datum.x, -diff.x) - pad,
        top: Math.min(datum.y, -diff.y) - pad
      });
      
      var vect = {
            x: diff.x + datum.x + (pointLeft ? ins : -ins - 2), 
            y: diff.y + datum.y + (pointUp ? ins : -ins - 2)
          },
          mag = Math.sqrt( Math.pow(vect.x, 2) + Math.pow(vect.y, 2) ),
          norm = {
            x: -vect.y * ins / mag,
            y: vect.x * ins / mag
          };
      
      $tip.find('path').attr({
        d: [
          'M', Math.max(0, -diff.x - datum.x) + pad, Math.max(0, -diff.y - datum.y) + pad,// Start at target (i.e. tip)
          'm', vect.x + norm.x, vect.y + norm.y,
          'm', -2 * norm.x, -2 * norm.y,
          'L', Math.max(0, -diff.x - datum.x) + pad, Math.max(0, -diff.y - datum.y) + pad,// Start at target (i.e. tip)
          'l', vect.x + norm.x, vect.y + norm.y
        ].join(' ')
      });
      
      lastPos.left = currP.left;
      lastPos.top  = currP.top;
    }
  };
})();