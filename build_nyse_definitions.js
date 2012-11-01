var fs = require('fs'),
    request = require('request'),
    csv = require('ya-csv'),
    flow = require('nimble'),
    ansi = require('ansi'),
    cursor = ansi(process.stdout);

// "NAME","TICKER","COUNTRY","ICB","INDUS","SUP SEC","SEC","SUB SEC"
var url = null,//'http://www.nyse.com/indexes/nyaindex.csv';
    nyaFile = __dirname + '/public/data/nyse/nya.csv',
    spxFile = __dirname + '/public/data/nyse/spx.csv',

    stocks = {
      headers: ['id', 'name'],
      data: []
    },
    groups = [],
    groupsTable = {},
    
    spxStocks = [],

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
    };
    
flow.series([prepareSpxList, buildDefinitions]);

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
  // Load and parse stock lists
  if(url) {
    request(url, function(error, response, body) {
      if(error || response.statusCode >= 400) {
        if(error) console.error(error);
        else console.error("Can't get NYA csv. Response status code is " + response.statusCode + '. Url: ' + url);
        return;
      }
      parseNyaCsv(body.replace(/^.*\n/, ''));
      callback();
    });
  }
  else if(nyaFile) {
    parseNyaCsv(fs.readFileSync(nyaFile, 'utf8').replace(/^.*\n/, ''));
    callback();
  }
}

function parseNyaCsv(stocksCsv) {
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
    
    stocks.data.push([sym, stockRaw.NAME]);
  });
  reader.parse(stocksCsv);

  fs.writeFileSync(__dirname + '/public/data/nyse/groups.json', JSON.stringify(groups));
  fs.writeFileSync(__dirname + '/public/data/nyse/stocks.json', JSON.stringify(stocks));
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

/*
var fs = require('fs'),
    csv = require('ya-csv'),
    ansi = require('ansi'),
    cursor = ansi(process.stdout);

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

function getOrCreateGroup(category, name) {
  var groupId = category + '_' + name;
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
      category: category,
      ids: []
    };
    
    if(category == 'index') {
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
}*/
