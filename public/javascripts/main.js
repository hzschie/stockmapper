mapper.stocks = new Backbone.Collection();
mapper.groups = new Backbone.Collection();

// Socket
var socket = io.connect();
socket.on('update', function(multiStockData) {
  _.forEach(multiStockData, function(data) {
    var stock = mapper.stocks.get(data[0]);
    if(!stock) return;
    
    stock.update(data);
    
/*
    // Remove stocks with no data
    if(!stock.get('lastTrade')) {
      var stockId = stock.get('id');
      _.forEach(
        mapper.groups.filter(function(group) { 
          return group.get('members').get(stockId);
        }),
        function(group) {
          group.get('members').remove(stock);
        }
      );
      mapper.stocks.remove(stock);
    }
*/
  });
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
    // socket.emit('subscribe', [stock.get('sym')]);// This would be individual stock subscription
    mapper.stocks.add(stock);
  });
  socket.emit('subscribe', mapper.stocks.pluck('id'));
  tryPopulateGroups();
});

// Groups JSON
$.getJSON(mapper.config.groupsUrl, function(response) {
  _.each(response, function(groupJson) {
    mapper.groups.add( new mapper.StockGroup(groupJson) );
  });
  tryPopulateGroups();
});

// Put stocks into groups
function tryPopulateGroups(groups) {
  if(mapper.stocks.length && mapper.groups.length) {
    mapper.groups.forEach(function(group) {
      var members = group.get('members');
      _.each(group.get('ids'), function(id) {
        members.add(mapper.stocks.get(id));
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
    
    buildView();
  }
}

// Initialize view and Historty
function buildView() {
  // Init views on document ready
  $(function() {
    var panel = new mapper.Panel($('.panel'), mapper.groups),
        map = new mapper.Map($('.map')),
        chart = new mapper.Chart($('.chart')),
        inspector = new mapper.Inspector($('.inspector')),
        viewState = new mapper.ViewState(),
        currentGroup = null,
        currentSort = mapper.sortFunctions['sym'];
        
    $('.map').css({ 'margin-top': panel.height() });
        
    viewState.on('change', function(viewState) {
      if(viewState.hasChanged('filter')) {
        if(currentGroup) {
          currentGroup.get('members').off('change', reSortIfNeeded);
        }
        
        var name = viewState.get('filter');
        currentGroup = !name ? mapper.allGroup : mapper.groups.where({urlName:name})[0];
        
        if(currentGroup) {
          if(currentGroup.get('members').comparator != currentSort) {
            currentGroup.get('members').comparator = currentSort;
            currentGroup.get('members').sort();
            
            currentGroup.get('members').on('change', reSortIfNeeded);
          }
          map.setModels(currentGroup.get('members'));
          chart.setModels(currentGroup.get('members'));
          panel.setSelectedGroup(currentGroup);
        }
        else
          throw new Error('Unknown group, ' + name);
      }
      
      if(viewState.hasChanged('sort')) {
        var sortId = viewState.get('sort') || 'sym';
        currentSort = mapper.sortFunctions[sortId];
        
        // TODO: move currentSort logic into StockGroup, so that it can re-sort when members' data changes... I think.
        if(currentGroup.get('members').comparator != currentSort) {
          currentGroup.get('members').comparator = currentSort;
          currentGroup.get('members').sort();
        }
        panel.setSelectedSort(sortId);
      }
    });

    (function(window, undefined){
        var History = window.History;
        if ( !History.enabled ) return;

        History.Adapter.bind(window, 'statechange', function(){
          var state = History.getState();
          viewState.fromUrl(state.url);
        });
        viewState.fromUrl(History.getState().url);
    })(window);

    panel.on('select_group', function(group) {
      viewState.set({ filter: group.get('urlName') }, { silent: true });
      History.pushState(null, null, viewState.toUrl());
    });
    
    panel.on('select_sort', function(sortVal) {
      viewState.set({ sort: sortVal }, { silent: true });
      History.pushState(null, null, viewState.toUrl());
    });
    
    map.on('inspect_tag', function(model, $tag) {
      inspector.inspectTag(model, $tag);
    });

    var resortTimeoutId = null;
    function reSortIfNeeded(changedModel) {
/*    if(!changedModel.hasChanged(currentSort.prop)) {
        return;
      }*/

      if(resortTimeoutId != null) {
        clearTimeout(resortTimeoutId);
      }
      resortTimeoutId = setTimeout(function() {
        console.log('resort now');
        currentGroup.get('members').sort();
        resortTimeoutId = null;
      }, 200);
    }
  });
}