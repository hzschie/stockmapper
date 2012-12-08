(function() {
  /* Mapping of Array positions to attributes that get applied to instances of Stock on data updates */
  mapper.config.getStockUpdateFields = function() { return [
    null,
    null, 
    { name:'lastTrade' },
    { name:'timestamp' },
    null,
    { name:'change' },
    { name:'previous' },
    { name:'open' },
    { name:'high' },
    { name:'low' },
    { name:'volume' },
    { name:'changePct' },
    { name:'marketCap' },
    { name:'avgVolume' },

    { name:'pe' },
    { name:'pb' },
    { name:'ps' },
    { name:'divYield' },
    { name:'roe' }
  ]; };

  /* Mapping of Array positions to attributes that get applied to instances of StockGroup on data updates */
  mapper.config.getGroupUpdateFields = function() { return [
    null,
    null, 
    { name:'lastTrade' },
    { name:'timestamp' },
    { name:'previous' },
    { name:'change' },
    { name:'volume' },
    { name:'changePct' },
    { name:'marketCap' }
  ]; };

  mapper.config.getInspectorBindings = function(bindings) {
    var Template = mapper.Template;
    _.each(bindings.stock, function(binding) {
      if(binding.$ == '.market_cap') {
        binding.field = 'marketCap';
        binding.formatter = Template.postfix(Template.commaFormat, 'Cr');
      }
      if(binding.$ == '.sym') {
        binding.formatter = function(val, $field) {
          if(val.length >= 10) return '<span class="tight">' + val + '</span>';
          return val;
        };
      }
    });
    return {
      index: bindings.group.concat([
        { $:'.category', field:'category', formatter:function(val) { return 'Stocks by ' + mapper.capitalize(val); } },
        { $:'.label', field:'name' },
        { $:'.last_trade', field:'lastTrade', formatter:Template.commaFormat },
        { $:'.change', field:'changeDir', formatter:Template.makeRedOrGreen },
        { $:'.change .amount', field:'change', formatter:Template.changeFormat },
        { $:'.change .percent', field:'changePct', formatter:Template.NaIfNaN(Template.postfix(Template.changeFormat, '%')) },
        { $:'.previous', field:'previous', formatter:Template.commaFormat },
        { $:'.volume', field:'volume', formatter:Template.commaFormat },
        { $:'.market_cap', field:'marketCap', formatter:Template.postfix(Template.commaFormat, 'Cr') }
      ])
    };
  };

  mapper.config.getDetailsBindings = function(bindings) {
    var Template = mapper.Template,
        crMarketCap = Template.postfix(Template.commaFormat, 'Cr');
    _.each(bindings.stock, function(binding) {
      if(binding.field == 'marketCap') {
        binding.formatter = crMarketCap;
      }
    });
  
    return {
      stock: bindings.stock.concat([
        { $:'.pe', field:'pe', formatter:Template.priceFormat },
        { $:'.pb', field:'pb', formatter:Template.priceFormat },
        { $:'.ps', field:'ps', formatter:Template.priceFormat },
        { $:'.div_yield', field:'divYield', formatter:Template.priceFormat },
        { $:'.roe', field:'roe', formatter:Template.priceFormat }
      ]),
      index: bindings.index.concat([
        { $:'.volume', field:'volume', formatter:Template.commaFormat },
        { $:'.market_cap', field:'marketCap', formatter:crMarketCap }
      ])
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

  mapper.config.getGroupTagHtml = function(group, $container) {
    if(group.get('type') == 'index') return [
        '<div class="val_right">',
          group.get('category') == 'Index' ? '<div class="value"></div>' : '',
          '<div class="change' + (group.get('category') == 'Index' ? '' : '_pct') + '"></div>',
        '</div>',
        '<label>', group.get('label'), '</label>'
      ].join('');
    else return [
        '<div class="val_right counts"></div>',
        '<label>', group.get('label'), '</label>'
      ].join('');
  };

  mapper.config.getGroupBindings = function(bindings) {
    var Template = mapper.Template;
    bindings.index.push({ $:'.change_pct', field:'changePct', formatter:Template.pctChangeFormatter() });
    return bindings;
  };
  /*
  mapper.config.getGroupBindings = function(bindings) {
    return {
      index: [
        { $:'.value', field:'lastTrade', formatter:Template.blankIfNull(Template.commaFormat) },
        // { $:'.change', field:'changePct', formatter:Template.blankIfNull(Template.postfix(Template.changeFormat, '%')) },
        { $:'.change', field:'change', formatter:Template.blankIfNull(Template.changeFormat) },
        { $:null, field:'changePct', formatter:function(changePct, $container) {
          if(changePct == null) return;
          $container.css({ 
            backgroundColor: mapper.changePctToHex(changePct, 5)
          });
          return null;
        }}
      ]
    };
  };*/
})();