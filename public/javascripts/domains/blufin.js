mapper.config.processInspectorBindings = function(bindings) {
};

mapper.config.getTagHtml = function(model) {
  var sym = model.get('sym');
  if(sym.length >= 11 &&
    (sym == "WINDSOR MACH" || sym == "VARDHMNPOLY" || sym == "MUNJALSHOWA" || sym == "INDORAMASYN")) {
      return '<span class="tight">' + sym + '</span>';
  }
  return sym;
};

mapper.config.getGroupType = function() { return 'blufin_index'; };

mapper.config.getInspectorBindings = function(bindings) {
  _.find(bindings.stock, function(binding) { return binding.$ == '.sym'; }).formatter = function(val, $field) {
    if(val.length >= 10) return '<span class="tight">' + val + '</span>';
    return val;
  };
  return {
    blufin_index: [
      { $:'.type', field:'type', formatter:function(val) { return 'Stocks by ' + mapper.capitalize(val); } },
      { $:'.label', field:'name' },
      { $:'.last_trade', field:'value', formatter:mapper.Inspector.commaFormat },
      { $:'.change', field:'changeDir', formatter:mapper.Inspector.makeRedOrGreen },
      { $:'.change .amount', field:'change', formatter:mapper.Inspector.changeFormat },
      { $:'.change .percent', field:'changePct', formatter:function(val) { return mapper.Inspector.changeFormat(val) + '%'; } },
      { $:'.previous', field:'previous', formatter:mapper.Inspector.commaFormat },
      { $:'.volume', field:'volume', formatter:mapper.Inspector.commaFormat },
      { $:'.market_cap', field:'marketCap', formatter:mapper.Inspector.commaFormat }
    ]
  };
};