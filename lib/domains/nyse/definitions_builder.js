// NYSE DEFINITIONS BUILDER

var csv = require('ya-csv'),
    flow = require('nimble'),
    fs = require('fs'),
    path = require('path');

module.exports = (function() {
  // "NAME","TICKER","COUNTRY","ICB","INDUS","SUP SEC","SEC","SUB SEC"
  var basePath = path.dirname(require.main.filename),
      nyaFile = path.resolve(basePath + '/public/data/nyse/nya.csv'),
      spxFile = path.resolve(basePath + '/public/data/nyse/spx.csv'),

      regions = {
        'United States': 'United States',
        'United Kingdom': 'Europe',
        'Switzerland': 'Europe',
        'Japan': 'Asia/Pacific',
        'France': 'Europe',
        'Australia': 'Asia/Pacific',
        'Germany': 'Europe',
        'Canada': 'Canada',
        'Spain': 'Europe',
        'Taiwan': 'Asia/Pacific',
        'Italy': 'Europe',
        'Denmark': 'Europe',
        'China': 'Asia/Pacific',
        'Netherlands': 'Europe',
        'Brazil': 'Latin America',
        'Belgium': 'Europe',
        'Mexico': 'Latin America',
        'Norway': 'Europe',
        'South Africa': 'MidEast/Africa',
        'South Korea': 'Asia/Pacific',
        'Finland': 'Europe',
        'India': 'Asia/Pacific',
        'Ireland': 'Europe',
        'Columbia': 'Latin America',
        'Russia': 'Asia/Pacific',
        'Indonesia': 'Asia/Pacific',
        'Peru': 'Latin America',
        'Sweden': 'Europe',
        'Chile': 'Latin America',
        'Philippines': 'Asia/Pacific',
        'Turkey': 'MidEast/Africa',
        'Greece': 'Europe',
        'Portugal': 'Europe',
        'New Zealand': 'Asia/Pacific',
        'Argentina': 'Latin America',
        'Hong Kong': 'Asia/Pacific',
        'Israel': 'MidEast/Africa'
      },
      
      stocks,
      groups,
      groupsTable,
      quotes,
      spxStocks,
      
      verbose = /true/i.test(process.env.VERBOSE),
      cursor;
      
  function reset(callback) {
    stocks = [];
    groups = [];
    groupsTable = {};
    quotes = ['^NYA', '^GSPC'];
    spxStocks = [];
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

  function buildDefinitions(callback) {
    var reader = csv.createCsvStreamReader(null, { columnsFromHeader: true }),
        countries = {},
        sectors = {},
        spx = null;
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

      stocks.push([sym, stockRaw.NAME]);
      quotes.push(sym);
    });
    reader.parse(fs.readFileSync(nyaFile, 'utf8').replace(/^.*\n/, ''));
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
        buildDefinitions,
        function() {
          callback && callback({ stocks:{ headers:['id', 'name'], data:stocks }, groups:groups, quotes:quotes });
        }
      ]);
    }
  };
})();

    


