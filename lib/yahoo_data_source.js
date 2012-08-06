var http = require('http'),
    fs = require('fs'),
    request = require('request'),
    flow = require('nimble'),
    csv = require('ya-csv');

var stocks = JSON.parse(fs.readFileSync(__dirname + '/../public/data/nyse/stocks.json')),
    symbols = stocks.data.map(function(stock) { return stock[0]; });
function YahooDataSource(callback) {
  var table = {};
  
  requestAll();
  
  this.get = function(id) {
    var current = table[id];
    if(current) {
      return current;
    }
  };
  
  this.getDaily = function(id, callback) {
    var d = new Date();
    d.setYear(d.getFullYear() - 2);
    request(
      'http://ichart.yahoo.com/table.csv?s=' + id + '&a=' + d.getMonth() + '&b=' + d.getDate() + '&c=' + d.getFullYear() + '&g=d',
      function(error, response, body) {
        if(error || response.statusCode >= 400) {
          if(error) console.error(error);
          else console.error("Can't get index constituents for indexId=1000. Response status code is " + response.statusCode);
          return;
        }
        
        var series = {
              headers: ['t', 'price', 'volume'],
              data: [],
              meta: {}
            },
            reader = csv.createCsvStreamReader(null, {
              columnsFromHeader: true,
              'separator': ',',
              'quote': '"',
              'escape': '"',       
              'comment': ''
            });
            
        reader.on('data', function(row) {
          var row = [Date.parse(row.Date), parseFloat(row.Close), parseFloat(row.Volume)];
          series.data.push(row);
          series.headers.forEach(function(h, i) {
            series.meta[h + '_min'] = ((series.meta[h + '_min'] != null) && Math.min(series.meta[h + '_min'], row[i])) || row[i];
            series.meta[h + '_max'] = ((series.meta[h + '_max'] != null) && Math.max(series.meta[h + '_max'], row[i])) || row[i];
          });
        });
        reader.parse(body);
        callback(series);
      }
    );
  };
    
  function requestAll() {
    var requests = [];
    for(var i = 0; i < symbols.length; i += 200) {
      requests.push(requestFunction(symbols.slice(i, i+200)));
    }
    flow.series(requests);
  }
  
  var quoteReader = csv.createCsvStreamReader(null, {
    'separator': ',',
    'quote': '"',
    'escape': '"',       
    'comment': ''
  });
  quoteReader.on('data', function(data) {
    data = ['stock'].concat(data);
    table[ data[1] ] = data;
    callback(data);
  });
  
  function requestFunction(symbols) {
    return function(cb) {
      request(
        'http://download.finance.yahoo.com/d/quotes.csv?s=' + symbols.join(',') + '&f=sl1d1t1c1pohgvp2j1a2',
        function(error, response, body) {
          if(error || response.statusCode >= 400) {
            if(error) console.error(error);
            else console.error("Can't request stocks. Response status code is " + response.statusCode);
            return;
          }
          quoteReader.parse(body);
          cb();
        }
      );
    };
  }
}

exports.YahooDataSource = YahooDataSource;