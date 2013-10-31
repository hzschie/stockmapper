// FORESIDE DEFINITIONS BUILDER

var csv = require('ya-csv'),
    flow = require('nimble'),
    fs = require('fs'),
    path = require('path');

module.exports = (function() {
  var basePath = path.dirname(require.main.filename),
  
      symbols,
      stocks,
      groups,
      groupsTable,
      quotes,
      
      verbose = /true/i.test(process.env.VERBOSE),
      cursor;
      
  function reset(callback) {
    symbols = [];
    stocks = [];
    groups = [];
    groupsTable = {};
    quotes = ['^ETFCOMP', '^ETFF'];
    callback();
  }
      
  function buildETFs(callback) {
    // ETFs csv copy/pasted from table at: http://finance.yahoo.com/etf/browser/mkt
    var reader = csv.createCsvFileReader(path.resolve(basePath + '/public/data/foreside/etfs.csv'), { 'separator': '\t', columnsFromHeader: true });
    reader.on('data', function(rowObj) {
      var sym = rowObj['Ticker'],
          name = rowObj['Fund Name'];
          
      createStock(sym, name);
    });
    reader.on('end', function() {
      callback();
    });
  }
  
  function createStock(sym, name) {
    if(symbols.indexOf(sym) != -1) {
      cursor.hex('#cccc00').write('Blocked ' + sym + '\tfrom creating duplicate symbol\n').reset();
      return;
    }
    verbose && cursor.write(sym + '\t' + name + '\n');
    symbols.push(sym);
    quotes.push(sym);
    stocks.push([sym, name]);
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
        cursor.hex('#cccc00').write('Created ' + sym + '\tfor ETF Composite (not in etfs.csv)\n').reset();
      }
      compositeMembers.push(sym);
    });
    reader.parse(compositeCSV);
    
    groups.push({
      id:'^ETFCOMP',
      safeId:'etf_composite',
      ids: compositeMembers,
      type: 'index',
      name: 'ETF Composite'
    });
    callback();
  }
  
  function buildProducts(callback) {
    // Randomly pick 50 etfs out of the composite to make the etf 50
    etfcompIds =  groups.filter(function(g) { return g.id == '^ETFCOMP'; })[0].ids.concat();
    eft50Ids = [];
    while(eft50Ids.length < 50) {
      eft50Ids.push(
        etfcompIds.splice(Math.floor(Math.random() * etfcompIds.length), 1)[0]
      );
    }
    
    groups.push({
      id:'^ETFF',
      safeId:'etf_50',
      ids: eft50Ids,//[],
      type: 'index',
      name: 'ETF 50'
    });
    groups.push({
      id:'^ETF25',
      safeId:'etf_25',
      ids: eft50Ids.slice(0, 25),//[],
      type: 'product',
      name: 'ETF 25'
    });
    groups.push({
      id:'^ETF25ne',
      safeId:'etf_25ne',
      ids: eft50Ids.slice(25, 50),//[],
      type: 'product',
      name: 'ETF 25ne'
    });
    callback();
  }
  
  function buildSectors(callback) {
    var reader = csv.createCsvFileReader(path.resolve(basePath + '/public/data/foreside/sectors.csv'), { 'separator': '\t', columnsFromHeader: true });
    var bads=0;
    reader.on('data', function(rowObj) {
      var sym = rowObj['Fund Symbol'],
          group = getOrCreateGroup(/*rowObj['Category']*/ 'cluster', capitalize(rowObj['Subcategory']));
      
      if(symbols.indexOf(sym) == -1) {
        createStock(sym, rowObj['Fund Name']);
        cursor.hex('#cccc00').write('Created ' + sym + '\tfor ' + group.category + ' => ' + group.name + '  (not in etfs.csv)\n').reset();
      }
      
      group && group.ids.push(sym);
    });
    reader.on('end', function() {
      callback();
    });
  }
  
  function getOrCreateGroup(category, name, type, id) {
    if(!name || name == ',') return null;

    var groupId = category + '_' + name;
        group = groupsTable[groupId];
    if(!group) {
      group = groupsTable[groupId] = {
        name: name,
        nickname: name,
        category: category.toLowerCase(),
        ids: []
      };

      group.type = type || 'group';
      if(id) group.id = id;

      groups.push(group);
    }

    return group;
  }
  
  function capitalize(str) {
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
  };

  return {
    build: function(_cursor, callback) {
      cursor = _cursor;
      flow.series([
        reset,
        buildETFs,
        buildComposite,
        buildProducts,
        buildSectors,
        function() {
          callback && callback({ stocks:{ headers:['id', 'name'], data:stocks }, groups:groups, quotes:quotes });
        }
      ]);
    }
  };
})();

    


