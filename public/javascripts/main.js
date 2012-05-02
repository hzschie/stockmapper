var socket = io.connect('http://localhost');
$.getJSON('/data/stocks.json', function(response) {
  mapper.stocks = new Backbone.Collection();
  
  // Init views on document ready
  $(function() {
    mapper.map = new mapper.Map($('.map'), mapper.stocks);
  });
  
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
});

socket.on('update', function(data) {
  mapper.stocks.get(data[0]).update(data);
});
