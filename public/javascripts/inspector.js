(function() {
  var Inspector = mapper.Inspector = function($container) {
    var priceFormat = d3.format('.2f'),
        commaFormat = d3.format(','),
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
          { $:'.change .amount', field:'change', formatter:d3.format('+.2f') },
          { $:'.change .percent', field:'changePct', formatter:function(val) { return val + '%'; } },

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
        targP = {},
        lastPos = {};
    
    this.inspectTag = function(model, $tag) {
      _.forEach(bindings, function(binding) {
        var $field = $container.find(binding.$),
            val = (binding.formatter || String)( model.get(binding.field), $field );
        if(val) $field.text(val);
      });
      
      var tagPos = $tag.offset(),
          bodyWidth = $('body').width(),
          _bubbW = bubbW = $container.width(),
          _pointLeft = pointLeft = tagPos.left <= bodyWidth / 2,
          offset = {
            x: pointLeft ? 86 : -bubbW - 56,
            y: 32
          },
          pos = {
            left: tagPos.left + offset.x,
            top: tagPos.top + offset.y
          };
      
      targP = {
        left: tagPos.left + (pointLeft ? tagPos.width : 0),
        top: tagPos.top + tagPos.height 
      };    
      $container.css(pos);
    };
    
    setInterval(function() {
      var currP = $container.offset(),
          pad = 20,
          ins = 10;// inset / how far is the pivot point from the corner
      if(currP.left == lastPos.left && currP.top == lastPos.top) return;
      
      if(pointLeft) {
        $tip.attr({
          width: Math.abs(currP.left - targP.left) + 2*pad,
          height: Math.abs(currP.top - targP.top) + 2*pad
        });
        $tip.css({
          left: Math.min(0, targP.left - currP.left) - pad,
          top: Math.min(0, targP.top - currP.top) - pad
        });
        
        var vect = {
              x: currP.left - targP.left + ins, 
              y: currP.top - targP.top + ins
            },
            normal = {
              x: -vect.y,
              y: vect.x
            },
            mag = Math.sqrt( Math.pow(normal.x, 2) + Math.pow(normal.y, 2) ),
            thickness = ins;
        
        normal.x *= thickness / mag;
        normal.y *= thickness / mag;
        
        $tip.find('path').attr({
          d: [
            'M', (Math.max(0, targP.left - currP.left) + pad), (Math.max(0, targP.top - currP.top) + pad),// Start at target (i.e. tip
            'l', vect.x + normal.x, vect.y + normal.y,
            'l', -2 * normal.x, -2 * normal.y,
            'z'
          ].join(' ')
        });
      }
      else {
        $tip.attr({
          width: Math.abs(currP.left + bubbW - targP.left) + 2*pad,
          height: Math.abs(currP.top - targP.top) + 2*pad
        });
        $tip.css({
          left: Math.min(bubbW, targP.left - currP.left) - pad,
          top: Math.min(0, targP.top - currP.top) - pad
        });
        
        var vect = {
              x: currP.left - targP.left + bubbW - ins - 2, 
              y: currP.top - targP.top + ins
            },
            normal = {
              x: -vect.y,
              y: vect.x
            },
            mag = Math.sqrt( Math.pow(normal.x, 2) + Math.pow(normal.y, 2) ),
            thickness = ins;
        
        normal.x *= thickness / mag;
        normal.y *= thickness / mag;
        
        $tip.find('path').attr({
          d: [
            'M', (Math.max(0, targP.left - currP.left - bubbW) + pad), (Math.max(0, targP.top - currP.top) + pad),// Start at target (i.e. tip
            // 'l', (currP.left - targP.left + bubbW - ins), (currP.top - targP.top + ins)
            'l', vect.x + normal.x, vect.y + normal.y,
            'l', -2 * normal.x, -2 * normal.y,
            'z'
          ].join(' ')
        });

      }
      lastPos.left = currP.left;
      lastPos.top  = currP.top;
    }, 30);
  };
})();