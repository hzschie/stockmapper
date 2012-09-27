var Stock = mapper.Stock = Backbone.Model.extend(
  {
    defaults: {
      hasData: false
    },
    
    initialize: function(hash) {
      this.set({
        sym: hash.sym || hash.id,
        isVeryActive: false,
        groups: []
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
      hash['isVeryActive'] = hash.volume / (hash.avgVolume || hash.volume) >= (this.get('veryActiveRatio') || mapper.config.veryActiveRatio);//1.96;
      hash['hasData'] = true;
      this.set(hash);
    },
    
    acquireTimeSeries: function(type, callback) {
      if(this.get(type)) return callback(this.get(type));
      var setter = {},
          _this = this;
      $.getJSON(
        '/series/' + type + '/' + this.id,
        function(data) {
          var ts = new mapper.TimeSeries(data, type);
          setter[type] = ts;
        
          if(type == 'intraday') {
            ts.price_ref = _this.get('previous');
          }
          _this.set(setter);
          callback(ts);
        }
      );
    },
    
    acquireNews: function(callback) {
      if(this.get('news')) return callback(this.get('news'));
      var _this = this;
      $.getJSON(
        '/news/' + this.id,
        function(data) {
          data.sort(function(a,b) { return (a.t < b.t) - (a.t > b.t); });
          _this.set({ news:data });
          callback(data);
        }
      );
    }
  },
  // STATIC methods
  {
    //sl1d1t1c1ohgvp2j1a2
    fields: [
      null,
      null, 
      { name:'lastTrade', isNum:true },
      { name:'timestamp', isNum:true },
      null,
      { name:'change', isNum:true },
      { name:'previous', isNum:true },
      { name:'open', isNum:true },
      { name:'high', isNum:true },
      { name:'low', isNum:true },
      { name:'volume', isNum:true },
      { name:'changePctString', isNum:false },
      { name:'marketCapString', isNum:false },
      { name:'avgVolume', isNum:true },
      
      { name:'pe', isNum:true },
      { name:'pb', isNum:true },
      { name:'ps', isNum:true },
      { name:'divYield', isNum:true },
      { name:'roe', isNum:true }
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
          members = this.get('members');
      members.on('add', function(model) {
        if( model.get('hasData') ) _this.updateCounts();
      });
      members.on('change:changeDir change:volume', function(model) {
        _this.updateCounts();
        _this.resortMembers(false);
      });
      
      this.on('change:comparator', function(_this) {
        _this.get('members').comparator = _this.get('comparator');
        _this.resortMembers(true);
      });
      
      hash.members.modelId = function(model) { return model.id; };
    },
    
    resortMembers: function(expedite) {
      if(expedite) {
        this._resortMembers();
        return;
      }
      var _this = this;
      if(!this.resortPending) {
        this.resortPending = true;
        Interval.callOnce({ fn:function() {
          _this.resortPending = false;
          _this._resortMembers();
        }, key:'resort_' + _this.get('urlName') }, Interval.LOW);
      }
    },
    _resortMembers: function() {
      if( !this.get('comparator') ) return;
      this.get('members').sort();
    },

    // Use Interval to collapse recalculations, to avoid doing it
    // needlessly many times during a large update
    updateCounts: function() {
      var _this = this;
      if(!this.updatePending) {
        this.updatePending = true;
        Interval.callOnce({ fn:function() {
          _this.updatePending = false;
          _this._updateCounts();
        }, key:'update_' + _this.get('urlName') }, Interval.LOW);
      }
    },
    // Recalculate ups and downs figures
    _updateCounts: function() {
      var members = this.get('members'),
          upsAndDowns = [0,0],
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
      this.set({
        upsAndDowns: upsAndDowns,
        volumeUp: volumeUp,
        volumeDown: volumeDown,
        volumeTotal: volumeTotal
      });
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
for(var key in mapper.sortFunctions) {
  mapper.sortFunctions[key].id = key;
}