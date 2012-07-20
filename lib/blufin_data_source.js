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
          console.error("Can't get index constituents for indexId=1000. Response status code is " + response.statusCode);
          return;
        }
        dataCallback( JSON.parse(body).map(parseQuoteData) );
      }
    );
  }
  
  function parseQuoteData(qd) {
    var date = new Date( parseInt(qd.Timestamp.match(/\((.*)\+/)[1], 10) );
    var id = qd.ScripCode,
        lastTrade = qd.CurrentPrice,
        lastTradeDate = (date.getMonth()+1) + '/' + date.getDate() + '/' + date.getFullYear(),
        lastTradeTime = null,
        change = qd.ValueChanged,
        open = qd.OpenPrice,
        high = qd.HighPrice,
        low = qd.LowPrice,
        volume = qd.Volume,
        changePctString = qd.PercentageChanged + '%',
        marketCapString = String(qd.MarketCap),
        avgVolume = 'N/A';

    return table[id] = [id, lastTrade, lastTradeDate, lastTradeTime, change, open, high, low, volume, changePctString, marketCapString, avgVolume];
  }
}
exports.BlufinDataSource = BlufinDataSource;