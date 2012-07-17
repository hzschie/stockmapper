var fs = require('fs'),
    request = require('request'),
    flow = require('nimble'),
    ansi = require('ansi'),
    cursor = ansi(process.stdout);

var urlBase = 'http://46.137.212.140:8080/Service/equities.svc/',
    actions = [],
    groups = {},
    stocks = {};
request(urlBase + 'GetEntireIndexList', function(error, response, body) {
  var indexesRaw = JSON.parse(body);
  cursor
    .hex('#00ff00')
    .bold()
    .write(indexesRaw.length + ' indexes\n')
    .reset();
  
  indexesRaw.forEach(function(index, i) {
    var indexId = index.IndexId;
    groups[indexId] = {
      name: index.IndexName,
      nickname: index.IndexName,
      type: index.Category,
      ids: []
    };
    
    actions.push(function(callback) {
      getIndexConstituents(indexId, callback);
    });
  });
  
  flow.parallel(actions, writeDefinitions);
});

function getIndexConstituents(indexId, callback) {
  var group = groups[indexId];
  request(urlBase + 'GetLatestIndexConstituentsDataByIndexID?IndexID=' + indexId, function(error, response, body) {
    if(error || response.statusCode >= 400) {
      cursor.hex('#cc0000').write('Data not available for IndexId ' + indexId + ' (' + group.name + ')\n');
      return callback();
    }
    
    var stocksRaw = JSON.parse(body);
    stocksRaw.forEach(function(stock) {
      var id = stock.ScripCode;
      stocks[id] = stocks[id] || [id, stock.ScripName, stock.ScripId];
      group.ids.push(id);
    });
    cursor
      .hex('#6666ff').write(group.name)
      .hex('#3333aa').write(' ids: ' + group.ids.join(',') + '\n');
    
    callback();
  });
}

function writeDefinitions() {
  var stocksJSON = {
    headers: ['id', 'name', 'scripId'],
    data: Object.keys(stocks).sort().map(function(key) { return stocks[key]; })
  };
  fs.writeFileSync(__dirname + '/public/data/bluefin/stocks.json', JSON.stringify(stocksJSON));
  
  var groupsJSON = Object.keys(groups).map(function(key) { return groups[key]; });
  fs.writeFileSync(__dirname + '/public/data/bluefin/groups.json', JSON.stringify(groupsJSON));
    
  cursor
    .hex('#00ff00')
    .bold()
    .write('DONE\n')
    .reset();
}