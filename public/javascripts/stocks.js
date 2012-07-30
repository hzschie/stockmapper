var Stock = mapper.Stock = Backbone.Model.extend(
  {
    defaults: {
      hasData: false
    },
    
    initialize: function(hash) {
      this.set({
        sym:hash.sym || hash.id,
        'isVeryActive': false
      });
    },
    
    update: function(array) {
      var hash = {};var _this=this;
      _.forEach(Stock.fields, function(field, i) {
        if(!field) return;
        hash[field.name] = field.isNum && array[i] != null ? Number(array[i]) : array[i];
      });
      hash['changeDir'] = hash['change'] == 0 ? 0 : (hash['change'] / Math.abs(hash['change']));
      hash['changePct'] = parseFloat(hash.changePctString);
      hash['marketCap'] = Stock.parseMarketCapString(hash.marketCapString);
      hash['isVeryActive'] = hash.volume / (hash.avgVolume || hash.volume) >= 1.96;
      hash['hasData'] = true;
      this.set(hash);
    }
  },
  // STATIC methods
  {
    //sl1d1t1c1ohgvp2j1a2
    fields: [
      null,
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
    },
    
    // Convenience getters, for d3 neatness
    sym: function(stock) { return stock.attributes['sym']; },
    changePct: function(stock) { return stock.attributes['changePct'] || 0; },
    changePctAbs: function(stock) { return Math.abs(Stock.changePct(stock)); },
    changePctToHex: function(stock) { return mapper.changePctToHex(Stock.changePct(stock)); },
    volume: function(stock) { return stock.attributes['volume'] || 0; }
  }
);

var StockGroup = mapper.StockGroup = Backbone.Model.extend(
  {
    initialize: function(hash) {
      hash.members = new Backbone.Collection(hash.members);
      hash.upsAndDowns = [0,0];
      hash.volumeUp = 0;
      hash.volumeDown = 0;
      hash.volumeTotal = 0;
      hash.label = hash.label || hash.nickname;
      hash.urlName = hash.type + ':' + hash.nickname.toLowerCase().replace(/\s|\/|\&/g, '+').replace(/\++/, '+');
      this.set(hash);

      var _this = this,
          timeoutId = null,
          members = this.get('members');
      var lbl='Technology';// TEMP
      members.on('change:changeDir change:volume', function(model) {
        // Recalculate ups and downs figures
        // Use Interval to collapse recalculations, to avoid doing it
        // needlessly many times during a large update
        Interval.callOnce({ fn:function() {
          console.log('Update upanddown.');
          var upsAndDowns = [0,0],
              volumeUp = 0,
              volumeDown = 0,
              volumeTotal = 0,
              vol, dir;
          members.each(function(model) {
            vol = model.attributes.volume || 0;
            dir = model.attributes.changeDir;
            if(dir == 1) {
              upsAndDowns[0] += 1;
              volumeUp += vol;
            }
            else if(dir == -1) {
              upsAndDowns[1] += 1;
              volumeDown += vol;
            }
            volumeTotal += vol;
          });
          _this.set({
            upsAndDowns: upsAndDowns,
            volumeUp: volumeUp,
            volumeDown: volumeDown,
            volumeTotal: volumeTotal
          });
        }, key:_this.get('urlName') }, Interval.LOW);
        
      });
      
      hash.members.modelId = function(model) { return model.id; };
    },
    
    update: function(array) {
      var hash = {};
      _.forEach(StockGroup.fields, function(field, i) {
        if(!field) return;
        hash[field.name] = field.isNum && array[i] != null ? Number(array[i]) : array[i];
      });
      hash['changeDir'] = hash['change'] == 0 ? 0 : (hash['change'] / Math.abs(hash['change']));
      hash['changePct'] = parseFloat(hash.changePctString);
      hash['hasData'] = true;
      this.set(hash);
    }
  },
  
  {
    fields: [
      null,
      null, 
      { name:'value', isNum:true },
      { name:'previous', isNum:true },
      { name:'change', isNum:true },
      { name:'volume', isNum:true },
      { name:'changePctString', isNum:false },
      { name:'marketCap', isNum:true }
    ]
  }
);

mapper.sortBy = function(attribute) {
  var sortFunction = function(a, b) {
    var val1 = a.get(attribute),
        val2 = b.get(attribute);
    return ((val1 < val2) - (val2 < val1)) || 
      (isNaN(val1) - isNaN(val2)) || 
      mapper.sortFunctions.sym(a, b);
  };
  sortFunction.prop = attribute;// If prop changes, we need to resort
  return sortFunction;
};
mapper.sortFunctions = {
  sym: function(a, b) {
    return a.get('sym') > b.get('sym') ? 1 : -1;
  },
  chg: mapper.sortBy('changePct'),
  vol: mapper.sortBy('volume'),
  cap: mapper.sortBy('marketCap')
};