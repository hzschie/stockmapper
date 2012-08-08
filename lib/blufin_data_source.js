var fs = require('fs'),
    request = require('request'),
    flow = require('nimble'),
    Series = require('./time_series');

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
      BlufinDataSource.urlBase + 'GetIntrdayData?ExchangeID=BSE&Key=' + id,
      function(error, response, body) {
        if(error || response.statusCode >= 400) {
          if(error) console.error(error);
          else console.error("Can't get intraday data for Key=" + id + ". Response status code is " + response.statusCode);
          return;
        }
        
        var prev;
        callback(new Series(
          ['t', 'price', 'volume'],
          JSON.parse(body),
          function(slice) {
            var output = [
              parseInt(slice.t.match(/Date.([0-9]*)\+/)[1], 10) + INDIA_TIMESHIFT,
              parseFloat(slice.cp),
              parseFloat(slice.v - (prev ? prev.v : 0))
            ];
            prev = slice;
            return output;
          }
        ));
      }
    );
  };
  
  this.getIntradayX = function(id, callback) {
    request(
      BlufinDataSource.urlBase + 'GetIntrdayData?ExchangeID=BSE&Key=' + id,
      function(error, response, body) {
        if(error || response.statusCode >= 400) {
          if(error) console.error(error);
          else console.error("Can't get intraday data for Key=" + id + ". Response status code is " + response.statusCode);
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
            parseInt( slice.t.match(/Date.([0-9]*)\+/)[1], 10 ) + INDIA_TIMESHIFT
          );
          
          index += !lastDate ? 0 : Math.round((date - lastDate) / A_MINUTE);
          if(index == 0) {
            output.t0 = Number(date);
            output.interval = A_MINUTE;
          }
          
          output.price[index] = slice.cp;
          output.volume[index] = slice.v - (lastVolume || 0);
          
          lastDate = date;
          lastVolume = slice.v;
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
    var id = data.sc,// ScripCode
        lastTrade = data.cp,// CurrentPrice
        date = new Date( parseInt(data.t.match(/\((.*)\+/)[1], 10) ),// Timestamp
        lastTradeDate = (date.getMonth()+1) + '/' + date.getDate() + '/' + date.getFullYear(),
        lastTradeTime = null,
        change = data.vc,// ValueChanged
        previous = data.pcp,// PreviousClosePrice
        open = data.o,// OpenPrice
        high = data.h,// HighPrice
        low = data.l,// LowPrice
        volume = data.v,// Volume
        changePct = data.pc,// PercentageChanged
        marketCapString = String(data.mc),// MarketCap
        avgVolume = data.av;// AverageVolume

    return table[id] = ['stock', id, lastTrade, lastTradeDate, lastTradeTime, change, previous, open, high, low, volume, changePct, marketCapString, avgVolume];
  }
  
  function parseIndexData(data) {
    var id = data.id,// IndexID
        value = data.cp,// CurrentPrice/IndexValue
        previous = data.pcp,// PreviousClose/PreviousClosePrice
        change = data.vc,// ValueChanged
        volume = data.v,// Volume
        changePct = data.pc,// PercentageChanged
        marketCap = data.mc;// MarketCap

    return table[id] = ['group', id, value, previous, change, volume, changePct, marketCap];
  }

}
exports.BlufinDataSource = BlufinDataSource;