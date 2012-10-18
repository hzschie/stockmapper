var fs = require('fs'),
    csv = require('ya-csv');
    
var stocks = {
      headers: ['id', 'name'],
      data: []
    },
    groups = [],
    groupsTable = {},
    groupBy = 'Category';

// ETFs csv copy/pasted from table at: http://finance.yahoo.com/etf/browser/mkt
var reader = csv.createCsvFileReader(__dirname + '/public/data/foreside/etfs.csv', { 'separator': '\t', columnsFromHeader: true }),
    rows = [];
reader.on('data', function(rowObj) {
  stocks.data.push([rowObj['Ticker'], rowObj['Fund Name']]);
  groupsTable[ rowObj[groupBy] ] = ++groupsTable[ rowObj[groupBy] ] || 1;
});
reader.on('end', function() {
  // console.log(stocks);
  // console.log(stocks.data.length + ' ETFs');
  // Object.keys(groupsTable).sort().forEach(function(key) { console.log(key + ': ' + groupsTable[key]); });
  // console.log(Object.keys(groupsTable).length + ' Groups');
  fs.writeFileSync(__dirname + '/public/data/foreside/groups.json', JSON.stringify(groups));
  fs.writeFileSync(__dirname + '/public/data/foreside/stocks.json', JSON.stringify(stocks));
});
