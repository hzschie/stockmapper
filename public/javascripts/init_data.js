$(function() {
  var tt = Date.now();
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
      optimize = !mapper.perf ? true : mapper.perf.optimizeDataInit,
      isStocksDone = false,
      isGroupsDone = false,
      isFirstPassDone = false;
  
  if(window.io) {// io would be defined if server decided to use WebSocket
    socket = io.connect();
    socket.on('update', parseIncomingMultiStockData);
  }
  else {// otherwise, we use regular http queries for heatmap data
    function requestHeatmap() { $.getJSON('/datasets/heatmap?random=' + Math.floor(Math.random() * 1000), parseIncomingMultiStockData); }
    setInterval(requestHeatmap, 60000);
    socket = { emit: requestHeatmap };
  }
  
  buildStockDefinitions(tryPopulateGroups);
  buildGroupDefinitions(tryPopulateGroups);
  
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
      // console.log('silent ' + (optimize && !isFirstPassDone) + ' work ' + i + ' of ' + multiStockData.length);

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
  
  function buildStockDefinitions(callback) {
    var field, i,
        headers = mapper.stocksJson.headers,
        hash,
        stocks = [];
    Interval.each(
      mapper.stocksJson.data,
      function(values) { 
        hash = {};
        for(field = headers[0], i = 0; i < headers.length; field = headers[++i]) {
          hash[field] = values[i];
        }
        stocks.push(new mapper.Stock(hash));
      },
      function() {
        mapper.models.add(stocks);
        mapper.stocks.add(stocks);
        isStocksDone = true;
        callback();
      },
      Interval.HIGH, Interval.MAX
    );
  }
  
  function buildGroupDefinitions(callback) {
    var groups = [];
    Interval.each(
      mapper.groupsJson,
      function(groupJson) {
        groupJson.type = groupJson.type || 'group';
        groups.push(new mapper.StockGroup(groupJson));
      },
      function() {
        mapper.models.add(groups);
        mapper.groups.add(groups);
        
        // Create the "All" group, if defined
        if(!mapper.config.allGroup) { /* do nothing */ }
        else if(mapper.allGroup = mapper.groups.get(mapper.config.allGroup)) {
          /* mapper.allGroup was find by id. So do nothing */
        }
        else if(typeof(mapper.config.allGroup) == 'string') {
          mapper.allGroup = mapper.groups.where({ name:mapper.config.allGroup })[0];
        }
        else {
          mapper.allGroup = new mapper.StockGroup(mapper.config.allGroup);
          mapper.models.add(mapper.allGroup);
          mapper.groups.add(mapper.allGroup);
        }
        isGroupsDone = true;
        callback();
      },
      Interval.HIGH, Interval.MAX
    );
  }
  
  // Put stocks into groups
  function tryPopulateGroups() {
    if(isStocksDone && isGroupsDone) {
      if(waitForFirstPass && !isFirstPassDone) {
        socket.emit('subscribe');
        return;
      }
      
      Interval.each(
        mapper.groups.models,
        function(group) {
          var stocks = [];
          _.each(group.get('ids'), function(id) {
            var stock = mapper.stocks.get(id);
            stocks.push(stock);
            stock.get('groups').push(group);
          });
          group.get('members').add(stocks);
        },
        function() {
          mapper.allGroup && mapper.allGroup.get('members').add(mapper.stocks.models);
          Interval.callOnce(mapper.dataReady, Interval.FREE_TIME);
          if(!waitForFirstPass) socket.emit('subscribe');
        }
      );
    }
  }
});