(function() {
  var Inspector = mapper.Inspector = function($container) {
    var bindings = [
          { $:'.name', field:'name' },
          { $:'.sym', field:'sym' },
          { $:'.last_trade', field:'lastTrade', formatter:Inspector.priceFormat },

          { $:'.change', field:'changeDir', formatter:Inspector.makeRedOrGreen },
          { $:'.change .amount', field:'change', formatter:d3.format('+.2f') },
          { $:'.change .percent', field:'changePct', formatter:function(val) { return val + '%'; } },

          { $:'.avg_volume', field:'avgVolume', formatter:Inspector.commaFormat },
          { $:'.volume', field:'volume', formatter:Inspector.commaFormat },
          { $:'.market_cap', field:'marketCapString' },

          { $:'.open', field:'open', formatter:Inspector.priceFormat },
          { $:'.high', field:'high', formatter:Inspector.priceFormat },
          { $:'.low', field:'low', formatter:Inspector.priceFormat }
        ],
        
        noOpFormatter = function(val) { return String(val); };
    this.inspect = function(model) {
      _.forEach(bindings, function(binding) {
        var $field = $container.find(binding.$),
            val = (binding.formatter || noOpFormatter)( model.get(binding.field), $field );
        
        if(val) $field.text(val);
      });
    };
  };
  
  Inspector.makeRedOrGreen = function(val, $field) {
    $field.removeClass('red green');
    if(val) $field.addClass(val == 1 ? 'green' : 'red');
    return null;
  };
  
  Inspector.priceFormat = d3.format('.2f');
  Inspector.commaFormat = d3.format(',');
})();