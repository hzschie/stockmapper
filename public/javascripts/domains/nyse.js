(function() {
  /* Mapping of Array positions to attributes that get applied to instances of Stock on data updates */
  mapper.config.getStockUpdateFields = function() {
    var numeric = mapper.MapperModel.numeric,
        parseMCap = mapper.MapperModel.parseMarketCapString;
    return [
      null,
      null, 
      { name:'lastTrade', formatter:numeric },
      { name:'timestamp', formatter:numeric },
      null,
      { name:'change', formatter:numeric },
      { name:'previous', formatter:numeric },
      { name:'open', formatter:numeric },
      { name:'high', formatter:numeric },
      { name:'low', formatter:numeric },
      { name:'volume', formatter:numeric },
      { name:'changePct', formatter:parseFloat },
      { name:'marketCapString', formatter:function(val, field, hash) { hash.marketCap = parseMCap(val); return val; } },
      { name:'avgVolume', formatter:numeric }
    ];
  };

  /* Mapping of Array positions to attributes that get applied to instances of StockGroup on data updates */
  mapper.config.getGroupUpdateFields = function() {
    return mapper.config.getStockUpdateFields();
  };

  mapper.config.getInspectorBindings = function(bindings) { 
    var Template = mapper.Template;
    return {
      index: bindings.group.concat([
        { $:'.sym', field:'sym' },
        { $:'.last_trade', field:'lastTrade', formatter:Template.priceFormat },
        { $:'.previous', field:'previous', formatter:Template.commaFormat },
        { $:'.change', field:'changeDir', formatter:Template.makeRedOrGreen },
        { $:'.change .amount', field:'change', formatter:Template.changeFormat },
        { $:'.change .percent', field:'changePct', formatter:Template.postfix(Template.changeFormat, '%') }
      ])
    };
  };

  mapper.config.getMapTagHtml = function(model) {
    var sym = model.get('sym');
    sym.match(/^(\w*)\-?(\w*)$/);
    return RegExp.$1 + (RegExp.$2 ? '<span>' + RegExp.$2 + '</span>' : '');
  };

  mapper.config.getGroupTagHtml = function(group, $container) {
    if(group.get('type') == 'index') return [
        '<div class="val_right">',
          '<div class="value"></div>',
          '<div class="change"></div>',
        '</div>',
        '<label>', group.get('label'), '</label>'
      ].join('');
    else return [
        '<div class="val_right counts"></div>',
        '<label>', group.get('label'), '</label>'
      ].join('');
  };
})();