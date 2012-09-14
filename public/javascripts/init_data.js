(function() {
  mapper.stocks = new Backbone.Collection();
  mapper.groups = new Backbone.Collection();

  // Socket
  var socket = io.connect(),
  
      multiStockData = [],
      waitForFirstPass = true,
      isFirstPassDone = false;
  socket.on('update', function(_multiStockData) {
    multiStockData = multiStockData.concat(_multiStockData);
    Interval.add({ fn: function() {
      var limit = Interval.MAX,
          i = 0,
          t = Date.now(),
          len = multiStockData.length;

      while(Date.now() - t < limit && i < len) {
        var data = multiStockData[i];
        try {
          /* data[0] is type (ie. 'group' or 'stock'). data[1] is id */
          mapper[ data[0] + 's' ].get(data[1]).update(data);
        }
        catch(e) {
          console.log("couldn't update:", data);
          console.error(e.message);
        }
        finally {
          i++;
        }
      }

      multiStockData.splice(0, i);
      if(multiStockData.length == 0) {
        Interval.remove(this);
        if(waitForFirstPass && !isFirstPassDone) {
          isFirstPassDone = true;
          tryPopulateGroups();
        }
      }
    
    }, key: 'process_data_update' }, Interval.HIGH);
  });

  // Stocks JSON
  $.getJSON(mapper.config.stocksUrl, function(response) {
    var field, i,
        headers = response.headers,
        hash;
    _.each(response.data, function(values) {
      hash = {};
      for(field = headers[0], i = 0; i < headers.length; field = headers[++i]) {
        hash[field] = values[i];
      }
    
      var stock = new mapper.Stock(hash);
      mapper.stocks.add(stock);
    });
    socket.emit('subscribe', mapper.stocks.pluck('id'));
    tryPopulateGroups();
  });

  // Groups JSON
  $.getJSON(mapper.config.groupsUrl, function(response) {
    _.each(response, function(groupJson) {
      var group = new mapper.StockGroup(groupJson);
      if(true || group.get('ids').length) mapper.groups.add(group);
    });
    var groupIds = _.reject(mapper.groups.pluck('id'), function(id) { return id == null; });
    groupIds.length && socket.emit('subscribe', groupIds);
  
    tryPopulateGroups();
  });

  // Put stocks into groups
  function tryPopulateGroups(groups) {
    if(mapper.stocks.length && mapper.groups.length && (!waitForFirstPass || isFirstPassDone)) {
      mapper.groups.forEach(function(group) {
        var members = group.get('members');
        _.each(group.get('ids'), function(id) {
          var stock = mapper.stocks.get(id);
          members.add(stock);
          stock.get('groups').push(group);
        });
      });

      // Create the "All" group, if defined
      if(typeof(mapper.config.allGroup) == 'string') {
        mapper.allGroup = mapper.groups.where({ name:mapper.config.allGroup })[0];
      }
      else {
        mapper.allGroup = new mapper.StockGroup(
          $.extend({ members: mapper.stocks.models }, mapper.config.allGroup)
        );
        mapper.groups.add(mapper.allGroup);
      }
    
      mapper.dataReady();
    }
  }
})();