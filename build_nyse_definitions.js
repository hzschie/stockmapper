var fs = require('fs'),
    csv = require('ya-csv'),
    ansi = require('ansi'),
    cursor = ansi(process.stdout);

/*    
// "NAME","TICKER","COUNTRY","ICB","INDUS","SUP SEC","SEC","SUB SEC"
var reader = csv.createCsvFileReader(__dirname + '/public/data/nyse/nya.csv', { columnsFromHeader: true }),
    countries = {};
reader.on('data', function(stockRaw) {
  countries[stockRaw.COUNTRY] = ++countries[stockRaw.COUNTRY] || 1;
});
reader.on('end', function(stockRaw) {
  console.log(Object.keys(countries).length,'countries');
  console.log(Object.keys(countries).map(function(c) { return c + ': ' + countries[c]; }).join(', '));
});
*/

var stocks = {
      headers: ['id', 'name'],
      data: []
    },
    groups = [],
    groupsTable = {},
    reader = csv.createCsvFileReader(__dirname + '/public/data/nyse/stocks.csv', { columnsFromHeader: true });
    
reader.on('data', function(stockRaw) {
  var sym = stockRaw.Symbol;
  stocks.data.push([sym, stockRaw.Name]);
  
  getOrCreateGroup('sector', stockRaw.Industry).ids.push(sym);
  getOrCreateGroup('country', stockRaw.Country).ids.push(sym);
  getOrCreateGroup('region', stockRaw.Region).ids.push(sym);
  
  if(stockRaw.SandP == 'YES') {
    getOrCreateGroup('index', 'S&P 500').ids.push(sym);
  }
  if(stockRaw.Dow == 'YES') {
    getOrCreateGroup('index', 'Dow Jones').ids.push(sym);
  }
});

reader.on('end', function() {
  fs.writeFileSync(__dirname + '/public/data/nyse/groups.json', JSON.stringify(groups));
  fs.writeFileSync(__dirname + '/public/data/nyse/stocks.json', JSON.stringify(stocks));
});

function getOrCreateGroup(type, name) {
  var groupId = type + '_' + name;
      group = groupsTable[groupId];
  if(!group) {
    var nickname;
    switch(name) {
      case 'Basic Materials': {
        nickname = 'Materials';
        break;
      }
      case 'Consumer Services': {
        nickname = 'Services';
        break;
      }
      case 'Oil and Gas': {
        nickname = 'Oil & Gas';
        break;
      }
      case 'Consumer Goods': {
        nickname = 'Goods';
        break;
      }
      case 'Telecommunications': {
        nickname = 'Telecom';
        break;
      }
      case 'Asia-Pacific': {
        nickname = 'Asia/Pacific';
        break;
      }
      case 'MidEast-Africa': {
        nickname = 'MidEast/Africa';
        break;
      }
      default: {
        nickname = name;
      }
    }
    group = groupsTable[groupId] = {
      name: name,
      nickname: nickname,
      type: type,
      ids: []
    };
    
    if(type == 'index') {
      group.inspector_type = 'index';
      switch(name) {
        case 'S&P 500':
          group.sym = 'SPX';
          break;
        case 'Dow Jones':
          group.sym = 'DJI';
          break;
      }
    }
    else {
      group.inspector_type = 'group';
    }
  
    groups.push(group);
  }

  return group;
}