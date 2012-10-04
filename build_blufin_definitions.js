var fs = require('fs'),
    request = require('request'),
    flow = require('nimble'),
    ansi = require('ansi');

var urlBase = 'http://46.137.212.140:8080/Service/equities.svc/',
    actions = [],
    groups = {},
    stocks = {},
    cursor = null;

// DETECT IF RUNNING AS STANDALONE SCRIPT, OR AS MODULE IMPORTED
// BY THE MAIN APP (FOR DYNAMIC REFRESHING)
if(require.main === module) {
  flow.series([createGroups, createStocks, writeDefinitions]);
  cursor = ansi(process.stdout);
}
else {
  var events = require('events');
  function Updater() {
    this.update = function(req, res) {
      if(res) {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        cursor = ansi(res);
      }
      else {
        cursor = ansi(process.stdout);
      }
      flow.series([createGroups, createStocks, writeDefinitions, function() { if(res) res.end(); }]);
    };
  }
  Updater.prototype = Object.create(events.EventEmitter.prototype, {
      constructor: {
          value: Updater,
          enumerable: false
      }
  });
  module.exports = new Updater();
}
    
function createGroups(callback) {
  request(urlBase + 'GetBlufinIndexList', function(error, response, body) {
    if(error || response.statusCode >= 400) {
      cursor.hex('#cc0000').write(
        'Data not available for GetBlufinIndexList. Status code was ' + response.statusCode + '\n'
      );
      return callback();
    }
    var groupsJson = JSON.parse(body);
    
    // Log
    cursor.hex('#00ff00').bold().write(groupsJson.length + ' groups\n').reset();
    
    // Gather required properties for each group and index it by group id
    groupsJson.forEach(function(group, i) {
      var groupId = group.id;// IndexId
      
      // Log
      cursor
        .hex('#6666ff').write(String(group.id))
        .hex('#3333aa').write(' (' + group.n + ')\n');
        
      groups[groupId] = {
        id: groupId,
        name: group.n,// IndexName
        nickname: group.n.replace(/^blufin /i, '').replace(/ index$/i, '').replace(/ and /, ' & '),
        type: group.c,// Category
        ids: []
      };
    });
    
    // Hardcodes creation of NIFTY and SENSEX groups
    groups['nifty'] = {
      id: 229,
      name: 'NIFTY',
      nickname: 'NIFTY',
      type: 'Index',
      ids: []
    };
    groups['sensex'] = {
      id: 201,
      name: 'SENSEX',
      nickname: 'SENSEX',
      type: 'Index',
      ids: []
    };
    
    callback();
  });
}

function createStocks(callback) {
  request(urlBase + 'GetLatestIndexConstituentsDataByIndexID?IndexID=1000', function(error, response, body) {
    if(error || response.statusCode >= 400) {
      cursor.hex('#cc0000').write(
        'Data not available for GetLatestIndexConstituentsDataByIndexID?IndexId=1000. Status code was ' + response.statusCode + '\n'
      );
      return callback();
    }
    
    var stocksRaw = JSON.parse(body),
        broadGroup = groups['1000'],
        niftyGroup = groups['nifty'],
        sensexGroup = groups['sensex'];
        
    // Log
    cursor.hex('#00ff00').bold().write('\n' + stocksRaw.length + ' stocks\n').reset();
    
    stocksRaw.forEach(function(stock) {
      var sym = stock.s;// ScripId
      stocks[sym] = stocks[sym] || [stock.cid, stock.n, sym];//[ScripCode, ScripName, sym]
      
      var sector = stock.sec,// Sector
          capitalization = stock.c,// Capitalization
          style = stock.st,// Style
          crosstab = (capitalization + ' ' + style),
          isNifty = stock.nifty == 1,
          isSensex = stock.sensex == 1;

      // Log
      cursor
        .hex('#6666ff').write('\n' + stock.s)
        .hex('#3333aa').write(' (' + stock.n + '):\n');

      for(var indexId in groups) {
        var group = groups[indexId];
        if(group.name == sector || group.name == capitalization || group.name == style || group.name == crosstab || 
            group == broadGroup || (isNifty && group == niftyGroup) || (isSensex && group == sensexGroup)) {
          group.ids.push(stock.cid);// ScripCode
          
          // Log
          cursor
            .hex('#3333aa').write('Add ')
            .hex('#6666ff').write(stock.s)
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

function writeDefinitions(callback) {
  var groupsJSON = Object.keys(groups).map(function(key) { return groups[key]; });
  var stocksJSON = {
    headers: ['id', 'name', 'sym'],
    data: Object.keys(stocks).sort().map(function(key) { return stocks[key]; })
  };
  
  if(module.exports instanceof Updater) {
    module.exports.emit('update', groupsJSON, stocksJSON);
  }
  else {
    fs.writeFileSync(__dirname + '/public/data/blufin/groups.json', JSON.stringify(groupsJSON));
    fs.writeFileSync(__dirname + '/public/data/blufin/stocks.json', JSON.stringify(stocksJSON));
  }
    
  cursor
    .hex('#00ff00')
    .bold()
    .write('DONE\n')
    .reset();
    
  callback();
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