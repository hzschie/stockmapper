var fs = require('fs'),
    request = require('request'),
    flow = require('nimble');

BlufinDataSource.urlBase = 'http://46.137.212.140:8080/Service/equities.svc/';

function BlufinDataSource(dataCallback) {
  var INDIA_TIMESHIFT = 19800000,
      A_MINUTE = 60000,
      groups = JSON.parse( fs.readFileSync(__dirname + '/../public/data/blufin/groups.json', 'utf8') ),
      groupIds = groups.map(function(group) { return group.id; }),
      table = {};
      
  requestAll();
  setInterval(requestAll, A_MINUTE);

  this.get = function(id) {
    var current = table[id];
    if(current) {
      return current;
    }
  };
  
  this.getIntraday = function(id, callback) {
    request(
      BlufinDataSource.urlBase + 'GetIntrdayData?ExchangeID=BSE&ScripCode=' + id,
      function(error, response, body) {
        if(error || response.statusCode >= 400) {
          if(error) console.error(error);
          else console.error("Can't get index constituents for indexId=1000. Response status code is " + response.statusCode);
          return;
        }
        
        var data = JSON.parse(body),
            output = {
              price: [],
              volume: []
            },
            index = 0,
            date, lastDate, lastVolume;
        data.forEach(function(slice) {
          date = new Date( 
            parseInt( slice.Timestamp.match(/Date.([0-9]*)\+/)[1], 10 ) + INDIA_TIMESHIFT
          );
          
          index += !lastDate ? 0 : Math.round((date - lastDate) / A_MINUTE);
          if(index == 0) {
            output.t0 = Number(date);
            output.interval = A_MINUTE;
          }
          
          output.price[index] = slice.CurrentPrice;
          output.volume[index] = slice.Volume - (lastVolume || 0);
          
          lastDate = date;
          lastVolume = slice.Volume;
        });
        output.t1 = Number(date);
        output.timestamp = Date.now() + INDIA_TIMESHIFT;
        callback(output);
      }
    );
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
        dataCallback( JSON.parse(body).map(parseIndexData).filter(function(a) { return groupIds.indexOf(a[1]) > -1; }) );
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
        previous = data.PreviousClosePrice,
        open = data.OpenPrice,
        high = data.HighPrice,
        low = data.LowPrice,
        volume = data.Volume,
        changePct = data.PercentageChanged,
        marketCapString = String(data.MarketCap),
        avgVolume = data.AverageVolume;

    return table[id] = ['stock', id, lastTrade, lastTradeDate, lastTradeTime, change, previous, open, high, low, volume, changePct, marketCapString, avgVolume];
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