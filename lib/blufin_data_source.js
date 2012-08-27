var fs = require('fs'),
    request = require('request'),
    flow = require('nimble'),
    Series = require('./time_series');

BlufinDataSource.urlBase = 'http://46.137.212.140:8080/Service/';

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
      BlufinDataSource.urlBase + 'equities.svc/GetIntrdayData?ExchangeID=BSE&Key=' + id,
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
  
  this.get5day = function(id, callback) {
    //http://46.137.212.140/BMI/data/532285_bse_4d.csv
    var _this = this,
        intraday,
        _4d;
    flow.parallel(
      [
        function(cb) { _this.getIntraday(id, function(series) { intraday = series; cb(); }); },
        function(cb) { getCsvTimeSeries(id, '4d', function(series) { _4d = series; cb(); }); }
      ], 
      function() {
        callback(intraday.concat(_4d));
      }
    );
  };

  this.getDaily = function(id, callback) {
    //http://46.137.212.140/BMI/data/532285_bse_his.csv
    getCsvTimeSeries(id, 'his', callback);
  };
  
  var csv = require('ya-csv');
  function getCsvTimeSeries(id, type, callback) {
    request(
      'http://46.137.212.140/BMI/data/' + id + '_bse_' + type + '.csv', callback,
      function(error, response, body) {
        if(error || response.statusCode >= 400) {
          if(error) console.error(error);
          else console.error("Can't get daily data for Key=" + id + ". Response status code is " + response.statusCode);
          return;
        }
        
        var series = new Series(['t', 'price', 'volume']),
            reader = csv.createCsvStreamReader(null, { columnsFromHeader: true });
        reader.on('data', function(row) {
          var parts = row[type == 'his' ? 'TDate' : 'Timestamp'].match(/(\d+)/g);
          series.addSlice([
            Date.UTC(parts[2], parts[0]-1, parts[1], parts[3] || 0, parts[4] || 0),
            parseFloat(row.CurrentPrice),
            parseFloat(row.Volume)
          ]);
        });
        reader.parse(body);
        
        series.sortOnField(0);
        
        // Non-historical data is cummulative for the day, so we need to convert it deltas
        if(type != 'his') {
          var prevVol = 0,
              maxVol = 0;
          series.data.reverse().forEach(function(slice, i) {
            var vol = slice[2];
            if(vol < prevVol) {// it's a new day...
              prevVol = 0;
            }
            slice[2] = vol - prevVol;
            
            maxVol = Math.max(maxVol, slice[2]);
            prevVol = vol;
          });
        }
        
        callback(series);
      }
    );
  }
  
  this.getNews = function(id, callback) {
    request(
      BlufinDataSource.urlBase + 'News.svc/GetLatestNews?query=' + id,
      function(error, response, body) {
        if(error || response.statusCode >= 400) {
          if(error) console.error(error);
          else console.error("Can't get news for Key=" + id + ". Response status code is " + response.statusCode);
          return;
        }
        
        callback(
          JSON.parse(body).map(function(article) {
            return {
              t: parseInt(article.Date.match(/\d+/)[0], 10),
              title: article.Title,
              source: article.Source,
              href: article.URL
            };
          })
        );
      }
    );
  };

  function requestAll() {
    request(
      BlufinDataSource.urlBase + 'equities.svc/GetLatestIndexConstituentsDataByIndexID?IndexID=1000',
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
      BlufinDataSource.urlBase + 'equities.svc/GetLatestIndexDatabyIndexId?IndexID=0',
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
        date = new Date( parseInt(data.t.match(/\((.*)\+/)[1], 10) );// Timestamp
    return table[id] = [
      'stock', 
      id,
      data.cp,// CurrentPrice
      (date.getMonth()+1) + '/' + date.getDate() + '/' + date.getFullYear(),
      null,
      data.vc,// ValueChanged
      data.pcp,// PreviousClosePrice
      data.o,// OpenPrice
      data.h,// HighPrice
      data.l,// LowPrice
      data.v,// Volume
      data.pc,// PercentageChanged
      String(data.mc),// MarketCap
      data.av,// AverageVolume
      
      data.pe,// PbyEVal
      data.pb,// PbyBVal
      data.ps,// PbySVal
      data.d,// DivYldVal
      data.rv// ROEVal
    ];
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