mapper.config.getGroupType = function() { return 'group'; /*return 'blufin_index';*/ };

mapper.config.getInspectorBindings = function(bindings) {
  _.each(bindings.stock, function(binding) {
    if(binding.$ == '.market_cap') {
      binding.field = 'marketCap';
      binding.formatter = mapper.Template.commaFormat;
    }
    if(binding.$ == '.sym') {
      binding.formatter = function(val, $field) {
        if(val.length >= 10) return '<span class="tight">' + val + '</span>';
        return val;
      };
    }
  });
  return {
    blufin_index: [
      { $:'.type', field:'type', formatter:function(val) { return 'Stocks by ' + mapper.capitalize(val); } },
      { $:'.label', field:'name' },
      { $:'.last_trade', field:'value', formatter:mapper.Template.commaFormat },
      { $:'.change', field:'changeDir', formatter:mapper.Template.makeRedOrGreen },
      { $:'.change .amount', field:'change', formatter:mapper.Template.changeFormat },
      { $:'.change .percent', field:'changePct', formatter:mapper.Template.NaIfNaN(mapper.Template.postfix(mapper.Template.changeFormat, '%')) },
      { $:'.previous', field:'previous', formatter:mapper.Template.commaFormat },
      { $:'.volume', field:'volume', formatter:mapper.Template.commaFormat },
      { $:'.market_cap', field:'marketCap', formatter:mapper.Template.commaFormat }
    ]
  };
};

mapper.config.getMapTagHtml = function(model) {
  var sym = model.get('sym');
  if(sym.length >= 11 &&
    (sym == "WINDSOR MACH" || sym == "VARDHMNPOLY" || sym == "MUNJALSHOWA" || sym == "INDORAMASYN")) {
      return '<span class="tight">' + sym + '</span>';
  }
  return sym;
};

mapper.config.getPanelGroupHtml = function(group, $container) {
  return [
    '<div class="val_right counts"></div>',
    '<div class="type">', group.get('type').toUpperCase(), '</div>', 
    '<label>', group.get('label'), '</label>'
  ].join('');
};
/*
mapper.config.getPanelGroupHtml = function(group, $container) {
  return [
    '<div class="val_right">',
      '<div class="change"></div>',
      '<div class="value"></div>',
    '</div>',
    '<div class="type">', group.get('type').toUpperCase(), '</div>', 
    '<label>', group.get('label'), '</label>'
  ].join('');
};
mapper.config.getGroupBindings = function(bindings) {
  return {
    blufin_index: [
      { $:'.change', field:'changePct', formatter:mapper.Template.blankIfNull(mapper.Template.postfix(mapper.Template.changeFormat, '%')) },
      { $:'.value', field:'value', formatter:mapper.Template.blankIfNull(mapper.Template.commaFormat) },
      { $:null, field:'changePct', formatter:function(changePct, $container) {
        if(changePct == null) return;
        $container.css({ 
          backgroundColor: mapper.changePctToHex(changePct, 5)
        });
        return null;
      }}
    ]
  };
};
*/
