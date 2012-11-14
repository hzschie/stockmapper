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
  
  mapper.config.getGroupsView = function(groups, $groups, $title) {
    var instance = {
      setSelected: function() {},
      search: function() {}
    };
    _.extend(instance, Backbone.Events);
    return instance;
  };
})();