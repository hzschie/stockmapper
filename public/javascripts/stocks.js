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
      });
      hash['changeDir'] = hash['change'] == 0 ? 0 : (hash['change'] / Math.abs(hash['change']));
      hash['changePct'] = parseFloat(hash.changePctString);
      hash['marketCap'] = Stock.parseMarketCapString(hash.marketCapString);
      hash['isVeryActive'] = hash.volume / (hash.avgVolume || hash.volume) >= 1.96;
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
      { name:'marketCapString', isNum:false },
      { name:'avgVolume', isNum:true }
    ],
    
    parseMarketCapString: function(capString) {
      var f = parseFloat(capString),
          multKey = (capString.match(/[MBT]$/) || [])[0];
      switch(multKey) {
        case 'T': return Math.round(f * 1e+12);
        case 'B': return Math.round(f * 1e+9);
        case 'M': return Math.round(f * 1e+6);
        default: return f;
      }
    }
  }
);

var StockGroup = mapper.StockGroup = Backbone.Model.extend(
  {
    initialize: function(hash) {
      hash.members = new Backbone.Collection(hash.members);
      hash.upsAndDowns = [0,0];
      hash.label = hash.label || hash.nickname;
      hash.urlName = hash.nickname.toLowerCase().replace(/\s|\/|\&/g, '+').replace(/\++/, '+');
      this.set(hash);

      var _this = this;
      hash.members.on('change:changeDir', function(model) {
        var prevDir = model.previous('changeDir'),
            newDir = model.get('changeDir'),
            currentUpsAndDowns = _this.get('upsAndDowns').concat();

        if(prevDir > 0) currentUpsAndDowns[0] -= 1;
        else if(prevDir < 0) currentUpsAndDowns[1] -= 1;

        if(newDir > 0) currentUpsAndDowns[0] += 1;
        else if(newDir < 0) currentUpsAndDowns[1] += 1;

        _this.set({ 'upsAndDowns': currentUpsAndDowns });
      });
    }
  }
);

mapper.sortBy = function(attribute) {
  return function(a, b) {
    var val1 = a.get(attribute),
        val2 = b.get(attribute);
    return ((val1 < val2) - (val2 < val1)) || 
      (isNaN(val1) - isNaN(val2)) || 
      mapper.sortFunctions.sym(a, b);
  };
};
mapper.sortFunctions = {
  sym: function(a, b) {
    return a.get('sym') > b.get('sym') ? 1 : -1;
  },
  chg: mapper.sortBy('changePct'),
  vol: mapper.sortBy('volume'),
  cap: mapper.sortBy('marketCap')
};