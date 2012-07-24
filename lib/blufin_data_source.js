var fs = require('fs'),
    request = require('request'),
    flow = require('nimble');

BlufinDataSource.urlBase = 'http://46.137.212.140:8080/Service/equities.svc/';

function BlufinDataSource(dataCallback) {
  var groups = JSON.parse( fs.readFileSync(__dirname + '/../public/data/blufin/groups.json', 'utf8') ),
      table = {};
      
  requestAll();
  setInterval(requestAll, 60000);

  this.get = function(id) {
    var current = table[id];
    if(current) {
      return current;
    }
  };
  
  function requestAll() {
    request(
      BlufinDataSource.urlBase + 'GetLatestIndexConstituentsDataByIndexID?IndexID=1000',
      function(error, response, body) {
        if(error || response.statusCode >= 400) {
          if(error) console.error(error);
          else console.error("Can't get index constituents for indexId=1000. Response status code is " + response.statusCode);
          return;
        }
        dataCallback( JSON.parse(body).map(parseStockData) );
      }
    );
    
    request(
      BlufinDataSource.urlBase + 'GetLatestIndexDatabyIndexId?IndexID=0',
      function(error, response, body) {
        if(error || response.statusCode >= 400) {
          if(error) console.error(error);
          else console.error("Can't get index data for indexId=0. Response status code is " + response.statusCode);
          return;
        }
        dataCallback( JSON.parse(body).map(parseIndexData) );
      }
    );
  }
  
  function parseStockData(data) {
    var date = new Date( parseInt(data.Timestamp.match(/\((.*)\+/)[1], 10) );
    var id = data.ScripCode,
        lastTrade = data.CurrentPrice,
        lastTradeDate = (date.getMonth()+1) + '/' + date.getDate() + '/' + date.getFullYear(),
        lastTradeTime = null,
        change = data.ValueChanged,
        open = data.OpenPrice,
        high = data.HighPrice,
        low = data.LowPrice,
        volume = data.Volume,
        changePct = data.PercentageChanged,
        marketCapString = String(data.MarketCap),
        avgVolume = 'N/A';

    return table[id] = ['stock', id, lastTrade, lastTradeDate, lastTradeTime, change, open, high, low, volume, changePct, marketCapString, avgVolume];
  }
  
  function parseIndexData(data) {
    var id = data.IndexID,
        value = data.IndexValue,
        previous = data.PreviousClose,
        change = data.ValueChanged,
        volume = data.Volume,
        changePct = data.PercentageChanged,
        marketCap = data.MarketCap;

    return table[id] = ['group', id, value, previous, change, volume, changePct, marketCap];
  }

}
exports.BlufinDataSource = BlufinDataSource;