(function() {
  var getStockUpdateFields = mapper.config.getStockUpdateFields,
      getGroupUpdateFields = mapper.config.getGroupUpdateFields;
  if(!getStockUpdateFields) console.warn('Missing mapper.config.getStockUpdateFields');
  if(!getGroupUpdateFields) console.warn('Missing mapper.config.getGroupUpdateFields');
      
  var MapperModel = mapper.MapperModel = Backbone.Model.extend(
    {
      defaults: {
        hasData: false,
        isHighlighted: false,
        type: 'model'
      },
    
      update: function(array, opts) {
        var hash = MapperModel.unpackUpdate(this.constructor.fields, array);
        hash['changeDir'] = hash['change'] == 0 ? 0 : (hash['change'] / Math.abs(hash['change']));
        hash['hasData'] = true;
        this.set(hash, opts);
        
        if(this.has('highlightFn')) this.set({ isHighlighted:this.get('highlightFn')(this) }, opts);
      },
    
      setHighlightFunc: function(fn) {
        this.set({ highlightFn: fn }, { silent: true });
        this.set({ isHighlighted: fn(this) });
      },
    
      acquireTimeSeries: function(seriesType, callback) {
        var existing = this.get(seriesType),
            setter = {},
            _this = this,
            url = '/series/' + this.id + '?type=' + seriesType + '&resource=' + this.get('type') + '&nse=' + this.get('isNse');
            
        url += existing ? '&timestamp=' + (existing.getTimestamp() || '') : '';
        url += '&random=' + Math.floor(Math.random() * 1000);
        
        if(existing) existing.isPending = true;
        _this.trigger('start_update_time_series', existing);
        
        $.getJSON(
          url,
          function(data) {
            if(!data) {
              _this.trigger('failed_update_time_series', existing);
              return callback && callback(null);
            }

            if(existing) existing.append(data.data);
            var ts = existing || new mapper.TimeSeries(data, seriesType);
            setter[seriesType] = ts;
            ts.ownerId = _this.id;
        
            if(seriesType == 'intraday') ts.price_ref = _this.get('previous');

            ts.isPending = false;
            _this.set(setter);
            _this.trigger('update_time_series', ts);
            callback && callback(ts);
          }
        );
      },
    
      acquireNews: function(callback) {
        // If news is locally cached, return it. TODO: expire the cache
        if(this.get('news')) return callback(this.get('news'));
      
        var _this = this;
        $.getJSON(
          // '/news/' + this.id + '?resource=' + this.get('type'),
          '/news/' + this.get('sym') + '?resource=' + this.get('type'),
          function(data) {
            data.sort(function(a,b) { return (a.t < b.t) - (a.t > b.t); });
            _this.set({ news:data });
            callback(data);
          }
        );
      }
    },
  
    // STATIC members
    {
      unpackUpdate: function(fields, array) {
        return _.reduce(fields, function(hash, field, i) {
          if(field) {
            hash[field.name] = field.formatter ? field.formatter(array[i], field.name, hash) : array[i];
          }
          // if(field) hash[field.name] = field.isNum && array[i] != null ? Number(array[i]) : array[i];
          return hash;
        }, {});
      },
      
      // Formatters for fields
      numeric: function(value, field, hash) { return value != null ? Number(value) : value; },
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
      sym: function(model) { return model.attributes['sym']; },
      changePct: function(model) { return model.attributes['changePct'] || 0; },
      changePctAbs: function(model) { return Math.abs(MapperModel.changePct(model)); },
      changePctToHex: function(model) { return mapper.changePctToHex(MapperModel.changePct(model)); },
      volume: function(model) { return model.attributes['volume'] || 0; }
    }
  );

  var Stock = mapper.Stock = MapperModel.extend(
    {
      initialize: function(hash) {
        this.set({
          type: 'stock',
          sym: hash.sym || hash.id,
          groups: []
        });
      }
    },
  
    // STATIC members
    {
      fields: getStockUpdateFields && getStockUpdateFields()
    }
  );

  var StockGroup = mapper.StockGroup = MapperModel.extend(
    {
      initialize: function(hash) {
        hash.type = hash.type || 'group';
        hash.sym = hash.sym || hash.id;
        hash.members = new Backbone.Collection(hash.members);
        hash.upsAndDowns = [0,0];
        hash.volumeUp = 0;// TODO: SHOULD BE IN BEHAVIOURS!
        hash.volumeDown = 0;
        hash.volumeTotal = 0;
        hash.nickname = hash.nickname || hash.name;
        hash.label = hash.label || hash.nickname;
        hash.domName = hash.safeId || hash.id;
        hash.urlName = (hash.category ? hash.category + ':' : '') + hash.nickname.toLowerCase().replace(/\s|\/|\&/g, '+').replace(/\++/, '+');
        this.set(hash);

        mapper.GroupBehaviors.keepCounts(this);
      
        this.on('change:comparator', function(_this) {
          _this.get('members').comparator = _this.get('comparator');
          _this.resortMembers(true);
        });
        
        var _this = this;
        hash.members.on('change:changePct change:volume', function(model) {
          _this.resortMembers(false);
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
          }, key:'resort_' + _this.get('urlName') }, Interval.FREETIME);
        }
      },
      _resortMembers: function() {
        if( !this.get('comparator') ) return;
        this.get('members').sort();
      }
    },
  
    // STATIC members
    {
      fields: getGroupUpdateFields && getGroupUpdateFields()
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
})();