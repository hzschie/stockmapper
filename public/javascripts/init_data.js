$(function() {
  mapper.models = new Backbone.Collection();
  mapper.stocks = new (Backbone.Collection.extend({
    datasets: {},
    acquireDataset: function(name, opts) {
      opts = opts || {};
      var _this = this,
          idPropName = opts.idPropName || 'id';
      $.getJSON(
        '/datasets/' + name,
        function(data) {
          for(var i = 0, len = data.length; i < len; i++) {
            var datum = data[i],
                model = _this.get(datum[idPropName]);
            if(model) {
              delete datum[idPropName];
              model.set(datum, { silent:true });
            }
          }
          _this.datasets[name] = true;
          opts.callback && opts.callback.call(_this, name);
        }
      );
    }
  }))();
  mapper.groups = new Backbone.Collection();

  var socket,
      multiStockData = [],
      waitForFirstPass = !mapper.isMobile,//true,
      optimize = mapper.isMobile,
      isFirstPassDone = false;
  
  if(window.io) {// io would be defined if server decided to use WebSocket
    socket = io.connect();
    socket.on('update', parseIncomingMultiStockData);
  }
  else {// otherwise, we use regular http queries for heatmap data
    socket = { emit: function() { /* no-op */} };// Stub out socket
    setInterval(function() {
      $.getJSON('/datasets/heatmap?random=' + Math.floor(Math.random() * 1000), parseIncomingMultiStockData);
    }, 60000);
    $.getJSON('/datasets/heatmap?random=' + Math.floor(Math.random() * 1000), parseIncomingMultiStockData);
  }
  
  // Parses incoming data regardless of transport method (WebSocket vs HTTP)
  function parseIncomingMultiStockData(_multiStockData) {
    multiStockData = multiStockData.concat(_multiStockData);
    Interval.add({ fn: function() {
      var limit = Interval.MAX,
          i = 0,
          t = Date.now(),
          len = multiStockData.length,
          data, collection, model;
          
      while(Date.now() - t < limit && i < len) {
        data = multiStockData[i];
        collection = mapper[ data[0] + 's' ];
        model = collection && collection.get(data[1]);
        model && model.update(data, { silent: optimize && !isFirstPassDone });
        i++;
      }

      multiStockData.splice(0, i);
      if(multiStockData.length == 0) {
        Interval.remove(this);
        
        if(optimize) {
          mapper.groups.each(function(group) {
            group.updateCounts();
            group.resortMembers(false);
          });
        }
        
        if(!isFirstPassDone) {
          isFirstPassDone = true;
          if(waitForFirstPass) tryPopulateGroups();
        }
      }
    
    }, key: 'process_data_update' }, Interval.HIGH);
  }
  
  // Stocks JSON
  var field, i,
      headers = mapper.stocksJson.headers,
      hash;
  _.each(mapper.stocksJson.data, function(values) {
    hash = {};
    for(field = headers[0], i = 0; i < headers.length; field = headers[++i]) {
      hash[field] = values[i];
    }
  
    var stock = new mapper.Stock(hash);
    mapper.models.add(stock);
    mapper.stocks.add(stock);
  });

  _.each(mapper.groupsJson, function(groupJson) {
    groupJson.type = groupJson.type || 'group';
    var group = new mapper.StockGroup(groupJson);
    if(true || group.get('ids').length) {
      mapper.models.add(group);
      mapper.groups.add(group);
    }
  });
  
  // Create the "All" group, if defined
  if(!mapper.config.allGroup) { /* do nothing */ }
  else if(typeof(mapper.config.allGroup) == 'string') {
    mapper.allGroup = mapper.groups.where({ name:mapper.config.allGroup })[0];
  }
  else {
    mapper.allGroup = new mapper.StockGroup(mapper.config.allGroup);
    mapper.models.add(mapper.allGroup);
    mapper.groups.add(mapper.allGroup);
  }
  
  var groupIds = _.reject(mapper.groups.pluck('id'), function(id) { return id == null; });
  
  tryPopulateGroups();
  
  socket.emit('subscribe');

  // Put stocks into groups
  function tryPopulateGroups(groups) {
    if(mapper.stocks.length && (mapper.groups.length || mapper.groupsJson.length == 0) && (!waitForFirstPass || isFirstPassDone)) {
      mapper.groups.forEach(function(group) {
        var members = group.get('members');
        _.each(group.get('ids'), function(id) {
          var stock = mapper.stocks.get(id);
          members.add(stock);
          stock.get('groups').push(group);
        });
      });
      
      mapper.allGroup && mapper.allGroup.get('members').add(mapper.stocks.models);
    
      mapper.dataReady();
    }
  }
});