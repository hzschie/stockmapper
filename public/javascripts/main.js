mapper.stocks = new Backbone.Collection();
mapper.groups = new Backbone.Collection();

// Socket
var socket = io.connect('http://amitair.local:3000');
socket.on('update', function(data) {
  mapper.stocks.get(data[0]).update(data);
});

// Stocks JSON
$.getJSON('/data/stocks.json', function(response) {
  var field, i,
      headers = response.headers,
      hash;
  _.each(response.data, function(values) {
    hash = {};
    for(field = headers[0], i = 0; i < headers.length; field = headers[++i]) {
      hash[field] = values[i];
    }
    
    var stock = new mapper.Stock(hash);
    socket.emit('subscribe', stock.get('sym'));
    mapper.stocks.add(stock);
  });
  tryPopulateGroups();
});

// Groups JSON
$.getJSON('/data/groups.json', function(response) {
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
    
    buildView();
  }
}

// Initialize view and Historty
function buildView() {
  // Init views on document ready
  $(function() {
    var panel = new mapper.Panel($('.panel'), mapper.groups),
        map = new mapper.Map($('.map'), mapper.stocks),
        viewState = new mapper.ViewState();
        
    viewState.on('change', function(viewState) {
      if(viewState.hasChanged('filter')) {
        var name = viewState.get('filter'),
            group = mapper.groups.find(function(group) {
              return group.get('urlName') == name;
            });
        
        if(group)
          map.setModels(group.get('members'));
        else if(!name)
          map.setModels(mapper.stocks);
        else
          throw new Error('Unknown group, ' + name);
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
  });
}