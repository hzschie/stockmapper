var fs = require('fs'),
    request = require('request'),
    flow = require('nimble'),
    csv = require('ya-csv'),
    time = require('time'),
    path = require('path'),
    CronJob = require('cron').CronJob,
    
    basePath = path.dirname(require.main.filename),
    
    LogUtil = require(basePath + '/lib/log_util'),
    Series = require(basePath + '/lib/time_series'),
    builder = require(basePath + '/build_definitions');

module.exports = BlufinDataSource;

if(!process.env.DATA_HOST) throw new Error('Missing Environment Variable DATA_HOST (e.g. DATA_HOST=54.251.130.77:8080)');
BlufinDataSource.urlBase = 'https://' + process.env.DATA_HOST + '/Service/';

function BlufinDataSource(dataCallback) {
  var now = new time.Date();
  now.setTimezone('Asia/Calcutta');
  
  var INDIA_TIMESHIFT = -now.getTimezoneOffset() * 60000,
      table = {},// For socket-based heatmap data
      cachedHeatmapDataset = null,// For query-based heatmap data
      cachedLowHighDataset = null,
      groupIds = null;
  
  // Request all quotes once definitions have been initialized or subsequently updated
  builder.on('update', function(definitions) { 
    groupIds = definitions.groups.map(function(group) { return group.id; });
    requestAllQuotes();
  });
  
  // Acquire LowHighDataset every weekday, at 7:30am (and also at app startup)
  new CronJob('15 * * * * *', requestAllQuotes, null, true, 'Asia/Calcutta');
  
  // Acquire LowHighDataset every weekday, at 7:30am (and also at app startup)
  new CronJob('00 30 7 * * 1-5', requestLowHighDataset, null, true, 'Asia/Calcutta');
  requestLowHighDataset();

  this.get = function(id) {
    var current = table[id];
    if(current) {
      return current;
    }
  };
  
  this.getDataset = function(name, response) {
    switch(name) {
      case 'heatmap': {
        if(!cachedHeatmapDataset) {
          response.writeHead(503, 'Still acquiring data...', {
            'Retry-After': 2// seconds
          });
          response.end();
        }
        else {
          response.writeHead(200, {
            'Content-Length': cachedHeatmapDataset.length,
            "Content-Type": "application/json"
          });
          response.end(cachedHeatmapDataset);
        }
        break;
      }
      case 'low_high': {
        if(!cachedLowHighDataset) {
          response.writeHead(503, 'Still acquiring data...', {
            'Retry-After': 2// seconds
          });
          response.end();
        }
        else {
          response.writeHead(200, {
            'Content-Length': cachedLowHighDataset.length,
            "Content-Type": "application/json"
          });
          response.end(cachedLowHighDataset);
        }
        break;
      }
    }
  };
  
  this.getTimeSeries = function(params, callback) {
    switch(params.type) {
      case 'intraday': return getIntraday(params, callback);
      case '5day': return get5day(params, callback);
      case 'daily': return getDaily(params, callback);
      default: callback(null);
    }
  };
  
  this.getNews = function(params, callback) {
    var url = BlufinDataSource.urlBase + 'News.svc/GetLatestNews?query=' + escape(params.id);
    var requestOpts = {
      url: url,
      headers: {
        Referer: "https://www.blufinresearch.com/"
      }
    };
    request(requestOpts, function(error, response, body) {
      if(error || response.statusCode >= 400) {
        console.error( LogUtil.cantGet('news', params, error || response.statusCode, url) );
        return callback([]);
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
    });
  };
  
  function getIntraday(params, callback) {
    var id = params.id,
        isNse = /true/i.test(params.nse),
        url = BlufinDataSource.urlBase + 'equities.svc/';
    if(/index/i.test(params.resource)) url += 'GetIndexIntrdayData?IndexID=' + id;
    else if(/stock/i.test(params.resource)) {
      url += 'GetIntrdayData?ExchangeID=' + (isNse ? 'NSE' : 'BSE') + '&Key=' + id;
    }
    else return callback(null);

    var requestOpts = {
      url: url,
      headers: {
        Referer: "https://www.blufinresearch.com/"
      }
    };
    request(requestOpts, function(error, response, body) {
      if(error || response.statusCode >= 400) {
        console.error( LogUtil.cantGet('intraday data', params, error || response.statusCode, url) );
        return callback(null);
      }
      
      var prev;
      callback(new Series(
        ['t', 'price', 'volume'],
        JSON.parse(body),
        function(slice) {
          var output = [
            parseInt(slice.t.match(/Date.([0-9]*)\+/)[1], 10) + INDIA_TIMESHIFT,
            slice.cp,
            Math.max(
              slice.v - (prev ? prev.v : 0),
              0
            )
          ];
          prev = slice;
          return output;
        }
      ).deleteBefore('t', params.timestamp));
    });
  };
  
  function get5day(params, callback) {
    var _this = this,
        intraday,
        _4d;
    flow.parallel(
      [
        function(cb) { getCsvTimeSeries(params, '4d', function(series) { _4d = series; cb(); }); },
        function(cb) { getIntraday(params, function(series) { intraday = series; cb(); }); }
      ], 
      function() {
        var combinedSeries = _4d ? _4d.concat(intraday) : intraday;
        combinedSeries && combinedSeries.sortOnField('t');
        callback(combinedSeries);
      }
    );
  };

  function getDaily(params, callback) {
    getCsvTimeSeries(params, 'his', callback);
  };
  
  function getCsvTimeSeries(params, type, callback) {
    var id = params.id,
        isBlufin = /true/i.test(params.blufin),
        isNse = /true/i.test(params.nse),
        url = BlufinDataSource.urlBase + 'BMIdata/' + id;

    if(/index/i.test(params.resource)) url += '_idx_' + (isBlufin ? 'blufin' : isNse ? 'nse' : 'bse') + '_';// Temporarily hard code 229 to nse
    else if(/stock/i.test(params.resource)) url += '_' + (isNse ? 'nse' : 'bse') + '_';
    else return callback(null);
    url += type + '.csv';

    var requestOpts = {
      url: url,
      headers: {
        Referer: "https://www.blufinresearch.com/"
      }
    };
    request(requestOpts, function(error, response, body) {
      if(error || response.statusCode >= 400) {
        if(error) console.error(error);
        else console.error('Can\'t get "' + type + '" data for id=' + id + '. Response status code is ' + response.statusCode + '. Url: ' + url);
        return callback(null);
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
      
/*
      var quote = table[id];
      if(quote && type == 'his') {
        // Append last slice, with current price
        series.addSlice([
          quote[3],// Timestamp
          quote[2],// CurrentPrice
          quote[10]// Volume
        ]);
      }
*/
      
      series.sortOnField('t');
      series.deleteBefore('t', params.timestamp);
    
      // Non-historical data is cummulative for the day, so we need to convert it deltas
      if(type != 'his') {
        var prevVol = 0,
            maxVol = 0;
        series.data.forEach(function(slice, i) {
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
    });
  }
  
  function requestLowHighDataset() {
    console.log(LogUtil.timestamp() + 'Acquiring LowHighDataset...');
    var url = BlufinDataSource.urlBase + '/equities.svc/GetIndexConstiuentsHighLow?IndexID=1000';
    var requestOpts = {
      url: url,
      headers: {
        Referer: "https://www.blufinresearch.com/"
      }
    };
    request(requestOpts, function(error, response, body) {
      if(error || response.statusCode >= 400) {
        console.error( LogUtil.cantGet('lows & highs', null, error || response.statusCode, url) );
        return;
      }
      
      cachedLowHighDataset = body;
      console.log(LogUtil.timestamp() + 'LowHighDataset acquired successfully!');
    });
  }
  
  function requestAllQuotes() {
    if(!groupIds) {
      console.error(LogUtil.timestamp() + 'skipped acquiring all quotes');
      return;
    }
    console.log(LogUtil.timestamp() + 'Acquiring all quotes...');
    var cachedRows = [];
    flow.parallel(
      [
        function(flowCallback) {
          var url = BlufinDataSource.urlBase + 'equities.svc/GetLatestIndexConstituentsDataByIndexID?IndexID=1000';
          var requestOpts = {
            url: url,
            headers: {
              Referer: "https://www.blufinresearch.com/"
            }
          };
          request(requestOpts, function(error, response, body) {
            if(error || response.statusCode >= 400) {
              console.error( LogUtil.cantGet('index constituents', 'indexId=1000', error || response.statusCode, url) );
              return;
            }
            var rows = JSON.parse(body).map(parseStockData);
            dataCallback(rows);
            
            cachedRows = cachedRows.concat(rows);
            flowCallback();
          });
        },
      
        function(flowCallback) {
          var url = BlufinDataSource.urlBase + 'equities.svc/GetLatestIndexDatabyIndexId?IndexID=0';
          var requestOpts = {
            url: url,
            headers: {
              Referer: "https://www.blufinresearch.com/"
            }
          };
          request(requestOpts, function(error, response, body) {
            if(error || response.statusCode >= 400) {
              console.error( LogUtil.cantGet('index data', 'indexId=0', error || response.statusCode, url) );
              return;
            }
            var rows = JSON.parse(body).map(parseIndexData).filter(function(a) { return groupIds.indexOf(a[1]) > -1; });
            dataCallback(rows);
            
            cachedRows = cachedRows.concat(rows);
            flowCallback();
          });
        }
      ],
      function() {
        cachedHeatmapDataset = JSON.stringify(cachedRows);
      }
    );
  }
  
  function parseStockData(data) {
    var id = data.cid;// ScripCode
    return table[id] = [
      'stock', 
      id,
      data.cp,// CurrentPrice
      parseInt(data.t.match(/Date.([0-9]*)\+/)[1], 10) + INDIA_TIMESHIFT,// Timestamp
      null,
      data.vc,// ValueChanged
      data.pcp,// PreviousClosePrice
      data.o,// OpenPrice
      data.h,// HighPrice
      data.l,// LowPrice
      data.v,// Volume
      data.pc,// PercentageChanged
      data.mc,// MarketCap
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
        timestamp = parseInt(data.t.match(/Date.([0-9]*)\+/)[1], 10) + INDIA_TIMESHIFT,// Timestamp
        previous = data.pcp,// PreviousClose/PreviousClosePrice
        change = data.vc,// ValueChanged
        volume = data.v,// Volume
        changePct = data.pc,// PercentageChanged
        marketCap = data.mc;// MarketCap

    return table[id] = ['group', id, value, timestamp, previous, change, volume, changePct, marketCap];
  }

}