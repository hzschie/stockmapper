var fs = require('fs'),
    request = require('request'),
    flow = require('nimble'),
    ansi = require('ansi'),
    cursor = ansi(process.stdout);

var urlBase = 'http://46.137.212.140:8080/Service/equities.svc/',
    actions = [],
    groups = {},
    stocks = {};
request(urlBase + 'GetBlufinIndexList', function(error, response, body) {
  var indexesRaw = JSON.parse(body);
  cursor
    .hex('#00ff00')
    .bold()
    .write(indexesRaw.length + ' indexes\n')
    .reset();
  
  indexesRaw.forEach(function(index, i) {
    var indexId = index.IndexId;
    groups[indexId] = {
      indexId: indexId,
      name: index.IndexName,
      nickname: index.IndexName.replace(/^blufin /i, '').replace(/ index$/i, '').replace(/ and /, ' & '),
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
      cursor.hex('#cc0000').write('Data not available for IndexId ' + indexId + ' (' + group.name + '). Status code was ' + response.statusCode + '\n');
      return callback();
    }
    
    var stocksRaw = JSON.parse(body);
    stocksRaw.forEach(function(stock) {
      var id = stock.ScripCode;
      stocks[id] = stocks[id] || [id, stock.ScripName, stock.ScripId];
      group.ids.push(id);
    });
    cursor
      .hex('#6666ff').write('IndexId ' + indexId + ' (' + group.name + ')')
      .hex('#3333aa').write(' ids: ' + group.ids.join(',') + '\n');
    
    callback();
  });
}

function writeDefinitions() {
  var stocksJSON = {
    headers: ['id', 'name', 'sym'],
    data: Object.keys(stocks).sort().map(function(key) { return stocks[key]; })
  };
  fs.writeFileSync(__dirname + '/public/data/blufin/stocks.json', JSON.stringify(stocksJSON));
  
  var groupsJSON = Object.keys(groups).map(function(key) { return groups[key]; });
  fs.writeFileSync(__dirname + '/public/data/blufin/groups.json', JSON.stringify(groupsJSON));
    
  cursor
    .hex('#00ff00')
    .bold()
    .write('DONE\n')
    .reset();
}

/*
Yields:
2644 stocks

ScripId Lengths:
2 characters: 1
3 characters: 114
4 characters: 146
5 characters: 224
6 characters: 316
7 characters: 554
8 characters: 702
9 characters: 412
10 characters: 145
11 characters: 29
12 characters: 1
*/