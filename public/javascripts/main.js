mapper.stocks = new Backbone.Collection();
mapper.groups = new Backbone.Collection();

// Init views on document ready
$(function() {
  mapper.panel = new mapper.Panel($('.panel'), mapper.groups);
  mapper.map = new mapper.Map($('.map'), mapper.stocks);
});

// Socket
var socket = io.connect('http://amitair.local:3000');
socket.on('update', function(data) {
  mapper.stocks.get(data[0]).update(data);
});

// Stocks JSON
// setTimeout(function() {// TEMP
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
// },1000);// TEMP

// Groups JSON
$.getJSON('/data/groups.json', function(response) {
  _.each(response, function(groupJson) {
    mapper.groups.add( new mapper.StockGroup(groupJson) );
  });
  tryPopulateGroups();
});

function tryPopulateGroups(groups) {
  if(mapper.stocks.length && mapper.groups.length) {
    mapper.groups.forEach(function(group) {
      var members = group.get('members');
      _.each(group.get('ids'), function(id) {
        members.add(mapper.stocks.get(id));
      });
    });
  }
}