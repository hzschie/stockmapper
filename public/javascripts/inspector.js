(function() {
  var Inspector = mapper.Inspector = function($container) {
    var priceFormat = d3.format(',.2f'),
        commaFormat = d3.format(','),
        changeFormat = d3.format('+.2f'),
        makeRedOrGreen = function(val, $field) {
          $field.removeClass('red green');
          if(val) $field.addClass(val == 1 ? 'green' : 'red');
          return null;
        },
    
        bindings = [
          { $:'.name', field:'name' },
          { $:'.sym', field:'sym' },
          { $:'.last_trade', field:'lastTrade', formatter:priceFormat },

          { $:'.change', field:'changeDir', formatter:makeRedOrGreen },
          { $:'.change .amount', field:'change', formatter:changeFormat },
          { $:'.change .percent', field:'changePct', formatter:function(val) { return changeFormat(val) + '%'; } },

          { $:'.avg_volume', field:'avgVolume', formatter:commaFormat },
          { $:'.volume', field:'volume', formatter:commaFormat },
          { $:'.market_cap', field:'marketCapString' },

          { $:'.open', field:'open', formatter:priceFormat },
          { $:'.high', field:'high', formatter:priceFormat },
          { $:'.low', field:'low', formatter:priceFormat }
        ],
        
        $tip = $container.find('svg'),
        pointLeft = false,
        bubbW = null,
        targP = null,
        lastPos = {};
        
    if(mapper.config.processInspectorBindings) {
      mapper.config.processInspectorBindings(bindings);
    }
    
    this.inspectTag = function(model, $tag) {
      if(!model) {
        $container.addClass('hidden');
        return;
      }
      
      $container.removeClass('hidden');
      
      _.forEach(bindings, function(binding) {
        var $field = $container.find(binding.$),
            val = model.get(binding.field);
        if(isNaN(val) && typeof(val) == 'number') val = 'N/A';
        if(val != 'N/A') {
          val = (binding.formatter || String)( val, $field );
        }
        if(val) $field.html(val);
      });
      
      inspectElement($tag, { x:57, y:20 });
    };
    
    this.inspectGroup = function(group, $tag) {
      if(!group) {
        $container.addClass('hidden');
        return;
      }
      
      $container.removeClass('hidden');
      
      // DO THE CONTENT ...
      
      inspectElement($tag, { x:20, y:20 });
    };
    
    function inspectElement($tag, spacing) {
      var tagPos = $tag.offset(),
          tagSz = { w:$tag.outerWidth(), h:$tag.outerHeight() },
          bodyWidth = $('body').width(),
          _bubbW = bubbW = $container.width(),
          _pointLeft = pointLeft = tagPos.left <= bodyWidth / 2,
          offset = {
            x: pointLeft ? tagSz.w + spacing.x : -bubbW + 1 - spacing.x,// 57
            y: tagSz.h + spacing.y// 20
          },
          pos = {
            left: tagPos.left + offset.x,
            top: tagPos.top + offset.y
          };
      
      tagPos.width = tagSz.w;
      tagPos.height = tagSz.h;
      
      targP = {
        left: tagPos.left + (pointLeft ? tagPos.width : 0),
        top: tagPos.top + tagPos.height
      };
      $container.css(pos);
    }
    
    d3.timer(updateTip);
    
    function updateTip() {
      var currP = $container.offset();
      if(!targP || (currP.left == lastPos.left && currP.top == lastPos.top)) return;
      
      var pad = 20,
          ins = 10,// inset / how far is the pivot point from the corner
          diff = {
            x: currP.left - targP.left,
            y: currP.top - targP.top
          },
          datum = {
            x: pointLeft ? 0 : bubbW,
            y: 0// not used yet
          };
      
      $tip.attr({
        width: Math.abs(diff.x + datum.x) + 2*pad,
        height: Math.abs(diff.y) + 2*pad
      });
      $tip.css({
        left: Math.min(datum.x, -diff.x) - pad,
        top: Math.min(0, -diff.y) - pad
      });
      
      var vect = {
            x: diff.x + datum.x + (pointLeft ? ins : -ins - 2), 
            y: diff.y + ins
          },
          mag = Math.sqrt( Math.pow(vect.x, 2) + Math.pow(vect.y, 2) ),
          norm = {
            x: -vect.y * ins / mag,
            y: vect.x * ins / mag
          };
      
      $tip.find('path').attr({
        d: [
          'M', Math.max(0, -diff.x - datum.x) + pad, Math.max(0, -diff.y) + pad,// Start at target (i.e. tip)
          'l', vect.x + norm.x, vect.y + norm.y,
          'l', -2 * norm.x, -2 * norm.y,
          'z'
        ].join(' ')
      });
      
      lastPos.left = currP.left;
      lastPos.top  = currP.top;
    }
  };
})();