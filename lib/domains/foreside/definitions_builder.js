// FORESIDE DEFINITIONS BUILDER

var csv = require('ya-csv'),
    flow = require('nimble'),
    fs = require('fs'),
    path = require('path');

module.exports = (function() {
  var basePath = path.dirname(require.main.filename),
  
      symbols = [],
      stocks = {
        headers: ['id', 'name'],
        data: []
      },
      groups = [],
      groupsTable = {},
      groupBy = 'Category',
      
      verbose = /true/i.test(process.env.VERBOSE),
      cursor;
      
  function buildETFs(callback) {
    // ETFs csv copy/pasted from table at: http://finance.yahoo.com/etf/browser/mkt
    var reader = csv.createCsvFileReader(path.resolve(basePath + '/public/data/foreside/etfs.csv'), { 'separator': '\t', columnsFromHeader: true });
    reader.on('data', function(rowObj) {
      var sym = rowObj['Ticker'],
          name = rowObj['Fund Name'];
          
      createStock(sym, name);
      
      groupsTable[ rowObj[groupBy] ] = ++groupsTable[ rowObj[groupBy] ] || 1;
    });
    reader.on('end', function() {
      // console.log(stocks);
      // console.log(stocks.data.length + ' ETFs');
      // Object.keys(groupsTable).sort().forEach(function(key) { console.log(key + ': ' + groupsTable[key]); });
      // console.log(Object.keys(groupsTable).length + ' Groups');
      callback();
    });
  }
  
  function createStock(sym, name) {
    verbose && cursor.write(sym + '\t' + name + '\n');
    symbols.push(sym);
    stocks.data.push([sym, name]);
  }
  
  function buildComposite(callback) {
    var compositeCSV = fs.readFileSync(path.resolve(basePath + '/public/data/foreside/composite.csv'), 'utf8'),
        splt = compositeCSV.split('\n');
        
    compositeCSV = splt.slice(4, splt.length - 7).join('\n');
    
    var reader = new csv.CsvReader(null, { 'separator': ';', columnsFromHeader: true }),
        compositeMembers = [];
    reader.on('data', function(rowObj) {
      var sym = rowObj['Security Ticker'].match(/^\w*/)[0];
      if(symbols.indexOf(sym) == -1) {
        createStock(sym, rowObj['Security Name']);
        cursor.hex('#cccc00').write('Creating stock: ' + sym + '\n').reset();
      }
      compositeMembers.push(sym);
    });
    reader.parse(compositeCSV);
    
    groups.push({
      id:'etf_composite',
      ids: compositeMembers,
      type: 'index',
      name: 'ETF Composite'
    });
    callback();
  }
  
  return {
    build: function(_cursor, callback) {
      cursor = _cursor;
      flow.series([
        buildETFs,
        buildComposite,
        function() {
          callback && callback({ stocks:stocks, groups:groups });
        }
      ]);
    }
  };
})();

    


