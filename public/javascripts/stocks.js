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
        hash['changeDir'] = hash['change'] == 0 ? 0 : (hash['change'] / Math.abs(hash['change']));
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

var StockGroup = mapper.StockGroup = Backbone.Model.extend(
  {
    initialize: function(hash) {
      hash.members = new Backbone.Collection();
      hash.upsAndDowns = [0,0];
      hash.urlName = hash.nickname.toLowerCase().replace(/\s|\/|\&/g, '+').replace(/\++/, '+');
      this.set(hash);
      hash.members.on('add', function(stock) {
        // console.log(stock.get('change'));
      });

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