var Stock = mapper.Stock = Backbone.Model.extend(
  {
    initialize: function(hash) {
      this.set({
        sym:hash.id,
        'isVeryActive': false
      });
    },
    
    update: function(array) {
      var hash = {};
      _.forEach(Stock.fields, function(field, i) {
        if(!field) return;
        hash[field.name] = field.isNum ? Number(array[i]) : array[i];
        hash['changePct'] = parseFloat(hash.changePctString);
        hash['isVeryActive'] = hash.volume / hash.avgVolume >= 2;
      });
      this.set(hash);
    }
  },
  // STATIC methods
  {
    //sl1d1t1c1ohgvp2j1a2
    fields: [
      null, 
      { name:'lastTrade', isNum:true },
      { name:'lastTradeDate', isNum:false },
      { name:'lastTradeTime', isNum:false },
      { name:'change', isNum:true },
      { name:'open', isNum:true },
      { name:'high', isNum:true },
      { name:'low', isNum:true },
      { name:'volume', isNum:true },
      { name:'changePctString', isNum:false },
      { name:'marketCap', isNum:false },
      { name:'avgVolume', isNum:true }
    ]
  }
);