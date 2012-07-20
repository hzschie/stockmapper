var fs = require('fs'),
    request = require('request'),
    flow = require('nimble'),
    ansi = require('ansi'),
    cursor = ansi(process.stdout);

var urlBase = 'http://46.137.212.140:8080/Service/equities.svc/',
    actions = [],
    groups = {},
    stocks = {};
    
flow.series([createGroups, createStocks, writeDefinitions]);
    
function createGroups(callback) {
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
    });
    
    callback();
  });
}

function createStocks(callback) {
  request(urlBase + 'GetLatestIndexConstituentsDataByIndexID?IndexID=1000', function(error, response, body) {
    if(error || response.statusCode >= 400) {
      cursor.hex('#cc0000').write('Data not available for IndexId=1000. Status code was ' + response.statusCode + '\n');
      return callback();
    }
    
    var stocksRaw = JSON.parse(body),
        broadGroup = groups['1000'];
    stocksRaw.forEach(function(stock) {
      var sym = stock.ScripId;
      stocks[sym] = stocks[sym] || [stock.ScripCode, stock.ScripName, sym];
      
      var sector = stock.Sector,
          capitalization = stock.Capitalization,
          style = stock.Style,
          crosstab = (capitalization + style).replace(/Index/, '');

      cursor
        .hex('#6666ff').write('\n' + stock.ScripId)
        .hex('#3333aa').write(' (' + stock.ScripName + '):\n');

      for(var indexId in groups) {
        var group = groups[indexId];
        if(group.name == sector || group.name == capitalization || group.name == style || group.name == crosstab || group == broadGroup) {
          group.ids.push(stock.ScripCode);
          
          cursor
            .hex('#3333aa').write('Add ')
            .hex('#6666ff').write(stock.ScripId)
            .hex('#3333aa').write(' to ')
            .hex('#6666ff').write(group.name + '\n');
        }
      }
      
    });
/*
    cursor
      .hex('#6666ff').write('IndexId ' + indexId + ' (' + group.name + ')')
      .hex('#3333aa').write(' ids: ' + group.ids.join(',') + '\n');
*/
    
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