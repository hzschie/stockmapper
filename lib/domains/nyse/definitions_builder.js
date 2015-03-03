// NYSE DEFINITIONS BUILDER

var csv = require('ya-csv'),
    flow = require('nimble'),
    fs = require('fs'),
    path = require('path');

module.exports = (function() {
  // "NAME","TICKER","COUNTRY","ICB","INDUS","SUP SEC","SEC","SUB SEC"
  var basePath = path.dirname(require.main.filename),
      stkFile = path.resolve(basePath + '/public/data/nyse/stk.csv'),
      spxFile = path.resolve(basePath + '/public/data/nyse/spx.csv'),
      ndxFile = path.resolve(basePath + '/public/data/nyse/ndx.csv'),
      ftxFile = path.resolve(basePath + '/public/data/nyse/ftx.csv'),
      ruiFile = path.resolve(basePath + '/public/data/nyse/rui.csv'),
      ooiFile = path.resolve(basePath + '/public/data/nyse/ooi.csv'),

      regions = {
		'United States': 'United States',
        'United Kingdom': 'Europe',
		'Belgium': 'Europe',
		'Finland': 'Europe',
		'France': 'Europe',
		'Germany': 'Europe',
		'Ireland': 'Europe',
		'Italy': 'Europe',
		'Luxembourg': 'Europe',
		'Netherlands': 'Europe',
		'Spain': 'Europe',
		'Sweden': 'Europe',
		'Switzerland': 'Europe',
		'Hong Kong': 'Other',
		'Israel': 'Other',
		'Canada': 'Other',
		'China': 'Other',
		'Panama': 'Other',
		'Russia': 'Other',
		'Japan': 'Other',
		'Singapore': 'Other'

      },

      stocks,
      groups,
      groupsTable,
      quotes,
      spxStocks,
      ndxStocks,
      ftxStocks,
      ruiStocks,
      ooiStocks,

      verbose = /true/i.test(process.env.VERBOSE),
      cursor;

  function reset(callback) {
    stocks = [];
    groups = [];
    groupsTable = {};
    quotes = ['^NYA', '^GSPC', '^NDX', '^OOI'];//, '^FTSE', '^RUI'
    spxStocks = [];
    ndxStocks = [];
    ftxStocks = [];
    ruiStocks = [];
    ooiStocks = [];
    callback();
  }

  function prepareSpxList(callback) {
    // Prepare SPX members
    var spxReader = csv.createCsvFileReader(spxFile, { 'separator': '\t', columnsFromHeader: true });
    spxReader.on('data', function(componentRow) {
      spxStocks.push(componentRow['Constituent Symbol']);
    });
    spxReader.on('end', function() {
      callback();
    });
  }

  function prepareNdxList(callback) {
    // Prepare NASDAQ 100 members
    var ndxReader = csv.createCsvFileReader(ndxFile, { 'separator': '\t', columnsFromHeader: true });
    ndxReader.on('data', function(componentRow) {
      ndxStocks.push(componentRow['Constituent Symbol']);
    });
    ndxReader.on('end', function() {
      callback();
    });
  }

  function prepareFtxList(callback) {
    // Prepare FTSE 100 members
    var ftxReader = csv.createCsvFileReader(ftxFile, { 'separator': '\t', columnsFromHeader: true });
    ftxReader.on('data', function(componentRow) {
      ftxStocks.push(componentRow['Constituent Symbol']);
    });
    ftxReader.on('end', function() {
      callback();
    });
  }

  function prepareRuiList(callback) {
    // Prepare Russell 1000 members
    var ruiReader = csv.createCsvFileReader(ruiFile, { 'separator': '\t', columnsFromHeader: true });
    ruiReader.on('data', function(componentRow) {
      ruiStocks.push(componentRow['Constituent Symbol']);
    });
    ruiReader.on('end', function() {
      callback();
    });
  }

  function prepareOoiList(callback) {
    // Prepare S&P Global 100 members
    var ooiReader = csv.createCsvFileReader(ooiFile, { 'separator': '\t', columnsFromHeader: true });
    ooiReader.on('data', function(componentRow) {
      ooiStocks.push(componentRow['Constituent Symbol']);
    });
    ooiReader.on('end', function() {
      callback();
    });
  }

  function buildDefinitions(callback) {
    var reader = csv.createCsvStreamReader(null, { columnsFromHeader: true }),
        countries = {},
        sectors = {},
        spx = null;
        ndx = null;
        ftx = null;
        rui = null;
        ooi = null;

    reader.on('data', function(stockRaw) {
      	var sym = stockRaw.TICKER.replace('/', '-'),
          sector = getOrCreateGroup('Sector', stockRaw.INDUS),
          country = getOrCreateGroup('Region', stockRaw.COUNTRY);

      if(sector) sector.ids.push(sym);
      if(country) country.ids.push(sym);
      if(spxStocks.indexOf(sym) > -1) {
        spx = spx || getOrCreateGroup('Index', 'S&P 500', 'index', '^GSPC');
        spx.ids.push(sym);
      }
      if(ndxStocks.indexOf(sym) > -1) {
        ndx = ndx || getOrCreateGroup('Index', 'NASDAQ 100', 'index', '^NDX');
        ndx.ids.push(sym);
      }
      if(ftxStocks.indexOf(sym) > -1) {
        ftx = ftx || getOrCreateGroup('Index', 'FTSE 100', 'index', '^FTSE');
        ftx.ids.push(sym);
      }
      if(ruiStocks.indexOf(sym) > -1) {
        rui = rui || getOrCreateGroup('Index', 'Russell 1000', 'index', '^RUI');
        rui.ids.push(sym);
      }
      if(ooiStocks.indexOf(sym) > -1) {
        ooi = ooi || getOrCreateGroup('Index', 'S&P Global 100', 'index', '^OOI');
        ooi.ids.push(sym);
      }
      stocks.push([sym, stockRaw.NAME]);
      quotes.push(sym);
    });
    //reader.parse(fs.readFileSync(nyaFile, 'utf8').replace(/^.*\n/, ''));
    reader.parse(fs.readFileSync(stkFile, 'utf8').replace(/^.*\n/, ''));
    callback();
  }

  function getOrCreateGroup(category, name, type, id) {
    if(category == 'Region') name = regions[name];
    if(!name || name == ',') return null;

    var groupId = category + '_' + name;
        group = groupsTable[groupId];
    if(!group) {
      group = groupsTable[groupId] = {
        name: name,
        nickname: getGroupNickname(name),
        category: category,
        ids: []
      };

      group.type = type || 'group';
      if(id) group.id = id;

      groups.push(group);
    }

    return group;
  }

  function getGroupNickname(name) {
    switch(name) {
      case 'Basic Materials': return 'Materials';
      case 'Consumer Services': return 'Services';
      case 'Oil and Gas': return 'Oil & Gas';
      case 'Consumer Goods': return 'Goods';
      case 'Telecommunications': return 'Telecom';
      case 'Asia-Pacific': return 'Asia/Pacific';
      case 'MidEast-Africa': return 'MidEast/Africa';
      default: return name;
    }
  }

  return {
    build: function(_cursor, callback) {
      cursor = _cursor;
      flow.series([
        reset,
        prepareSpxList,
		prepareNdxList,
		// prepareFtxList,
		// prepareRuiList,
		prepareOoiList,
        buildDefinitions,
        function() {
          callback && callback({ stocks:{ headers:['id', 'name'], data:stocks }, groups:groups, quotes:quotes });
        }
      ]);
    }
  };
})();




