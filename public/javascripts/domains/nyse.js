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
mapper.config.getGroupUpdateFields = function() { return [
  null,
  null, 
  { name:'lastTrade', isNum:true },
  { name:'timestamp', isNum:true },
  { name:'previous', isNum:true },
  { name:'change', isNum:true },
  { name:'volume', isNum:true },
  { name:'changePctString', isNum:false },
  { name:'marketCap', isNum:true }
]; };

mapper.config.getGroupType = function(category, group) {
  if(category == 'index') { return category; };
  return 'group';
};

mapper.config.getInspectorBindings = function() { 
  return {
    index: [
      { $:'.name', field:'name' },
      { $:'.sym', field:'sym' }
    ]
  };
};

mapper.config.getMapTagHtml = function(model) {
  var sym = model.get('sym');
  sym.match(/^(\w*)\-?(\w*)$/);
  return RegExp.$1 + (RegExp.$2 ? '<span>' + RegExp.$2 + '</span>' : '');
};

mapper.config.getGroupTagHtml = function(group, $container) {
  if(group.get('category') == 'index') return [
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
