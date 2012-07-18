var fs = require('fs'),
    request = require('request'),
    flow = require('nimble');

BlufinDataSource.urlBase = 'http://46.137.212.140:8080/Service/equities.svc/';

function BlufinDataSource(dataCallback) {
  var groups = JSON.parse( fs.readFileSync(__dirname + '/../public/data/blufin/groups.json', 'utf8') ),
      table = {};
      
  requestAll();

  this.get = function(id) {
    var current = table[id];
    if(current) {
      return current;
    }
  };
  
  function requestAll() {
    var actions = groups.map(function(group) {
      var indexId = group.indexId;
      return function(flowCallback) {
        request(
          BlufinDataSource.urlBase + 'GetLatestIndexConstituentsDataByIndexID?IndexID=' + indexId,
          function(error, response, body) {
            if(error || response.statusCode == 400) {
              console.error("Can't get index constituents for indexId " + indexId);
              return flowCallback();
            }
            
            dataCallback( JSON.parse(body).map(parseQuoteData) );
            flowCallback();
          }
        );
      };
    });
    flow.parallel(actions);
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