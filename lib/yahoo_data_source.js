var http = require('http'),
    fs = require('fs'),
    request = require('request'),
    flow = require('nimble'),
    csv = require('ya-csv'),
    time = require('time'),
    CronJob = require('cron').CronJob,
    FeedParser = require('feedparser'),
    LogUtil = require('./log_util'),
    Series = require('./time_series');

module.exports = YahooDataSource;

var symbols = JSON.parse(fs.readFileSync(__dirname + '/../public/data/' + process.env.DATA_DOMAIN + '/quotes.json'));
function YahooDataSource(callback) {
  var date = new time.Date();
  date.setTimezone('America/New_York');
  
  var nycTimeShifted = function(time) { date.setTime(time); return time - date.getTimezoneOffset() * 60000; },
      table = {},// For socket-based heatmap data, holds all quotes, indexed by sym
      heatmapData = [],// The cached, full set
      cachedHeatmapDataset = null,// The JSON Stringified version of full set
      incomingHeatmapData;// Transient set, during data refresh
  
  if(/true/i.test(process.env.CANNED_DATA)) {
    cachedHeatmapDataset = fs.readFileSync(__dirname + '/../public/data/' + process.env.DATA_DOMAIN + '/heatmap.cache', 'utf8');
  }
  else {
    // Acquire LowHighDataset every weekday, at 7:30am (and also at app startup)
    new CronJob('15 */5 * * * *', requestAllQuotes, null, true);
    requestAllQuotes();
  }
  
  this.get = function(id) {
    var current = table[id];
    if(current) {
      return current;
    }
  };
  
  this.getAllQuotes = function() {
    return heatmapData;
  };

  this.getDataset = function(name, response) {
    // switch(name) {
    //   case 'heatmap': {
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
    //     break;
    //   }
    // }
  };
    
  this.getTimeSeries = function(params, callback) {
    switch(params.type) {
      case 'intraday':
      case '5day': return getIntraday(params, callback);
      case 'daily': return getDaily(params, callback);
      default: callback(null);
    }
  };
  
  this.getNews = function(params, callback) {
    if(/true/i.test(process.env.CANNED_DATA)) {
      if(/SPY/i.test(params.id)) {
        fs.readFile(__dirname + '/../public/data/' + process.env.DATA_DOMAIN + '/etf_composite_news.cache', 'utf8', function(err, data) { callback(JSON.parse(data)); });
      }
      else {
        callback([]);
      }
      return;
    }

    var feedParser = new FeedParser(),
        articles = [],
        url = 'http://feeds.finance.yahoo.com/rss/2.0/headline?region=US&lang=en-US&s=' + params.id;
        
    request(url)
      .on('error', function(error) {
        // This error handler hasn't been properly tested yet, but it's made to 
        // account for 'connect ETIMEDOUT' error, which occurs periodically and could crash the server :(
        console.error( LogUtil.cantGet('news', params, error) );
        return callback([]);
      })
      .pipe(feedParser)
      .on('error', function(error) {
        console.error( "Can't parse news: " + url );
        return callback([]);
      })
      .on('readable', function() {
        var stream = this,
            article;
        while ((article = stream.read()) && article.link && articles.length < 10) {
          articles.push(article);
        }
      })
      .on('end', function() {
        callback(
          articles.map(function(article) {
            var link = article.link.split('*')[1] || article.link;
            return {
              t: Number(article.date),
              title: article.title,
              source: link.match(/^https?\:\/\/(www\.)?([^\/]*)\//i)[2],
              href: link
            };
          })
        );
      });
  };
  
  function getIntraday(params, callback) {
    var id = params.id,
        url = 'http://chartapi.finance.yahoo.com/instrument/1.0/' + id + '/chartdata;type=quote;range=' + (params.type == '5day' ? '5d' : '1d') + '/json/';
        
    if(/true/i.test(process.env.CANNED_DATA) && id == '^ETFCOMP') {
      fs.readFile(__dirname + '/../public/data/' + process.env.DATA_DOMAIN + '/etf_composite_' + params.type + '.cache', 'utf8', function(err, data) { callback(JSON.parse(data)); });
      return;
    }
        
    request(
      url,
      function(error, response, body) {
        if(error || response.statusCode >= 400) {
          console.error( LogUtil.cantGet('chart data', id, error || response.statusCode, url) );
          return callback(null);
        }
        
        try {
          var seriesJson = JSON.parse(
            body.substring(
              body.indexOf('"series" : ') + 11,
              body.length - 4
            )
          );

          callback(new Series(
            ['t', 'price', 'volume'],
            seriesJson,
            function(slice) {
              var output = [
                nycTimeShifted(slice.Timestamp * 1000),
                slice.close,
                slice.volume
              ];
              prev = slice;
              return output;
            }
          ).deleteBefore('t', params.timestamp));
        }
        catch(e) {
          console.error("Couldn't parse series for " + id + '. Url: ' + url);
          callback(null);
        }
      }
    );
  }

  function getDaily(params, callback) {
    var id = params.id,
        d = new Date();
    d.setYear(1900);
    var url = 'http://ichart.yahoo.com/table.csv?s=' + id + '&a=' + d.getMonth() + '&b=' + d.getDate() + '&c=' + d.getFullYear() + '&g=d';
    request(
      url,
      function(error, response, body) {
        if(error || response.statusCode >= 400) {
          if(error) console.error(error);
          else console.error("Can't get chart data for s=" + id + ". Response status code is " + response.statusCode + '. Url: ' + url);
          return;
        }
        
        var series = new Series(['t', 'price', 'volume']),
            reader = csv.createCsvStreamReader(null, { columnsFromHeader: true });
        reader.on('data', function(row) {
          series.addSlice( [Date.parse(row.Date), parseFloat(row['Adj Close']), parseFloat(row.Volume)] );
        });
        reader.parse(body);
        
        series.data.reverse();// Yahoo sorts latest to earliest, and we want the opposite. Heavier alternative: series.sortOnField('t');
        callback(series.deleteBefore('t', params.timestamp));
      }
    );
  };
    
  function requestAllQuotes() {
    console.log(LogUtil.timestamp() + 'Request all quotes');
    if(incomingHeatmapData != null) {
      console.log(LogUtil.timestamp() + 'Cancel all quotes request!!!');
      return;
    }
    var requests = [];
    for(var i = 0; i < symbols.length; i += 200) {
      requests.push(requestFunction(symbols.slice(i, i+200)));
    }
    
    incomingHeatmapData = [];
    flow.series(requests, function() {
      if(incomingHeatmapData.length > 0) {
        heatmapData = incomingHeatmapData;
        cachedHeatmapDataset = JSON.stringify(heatmapData);
        console.log(LogUtil.timestamp() + 'All quotes acquired successfully!');
      }
      else {
        console.log(LogUtil.timestamp() + 'Quotes not available');
      }
      incomingHeatmapData = null;
    });
  }
  
  var quoteReader = csv.createCsvStreamReader(null, {
    'separator': ',',
    'quote': '"',
    'escape': '"',       
    'comment': ''
  });
  quoteReader.on('data', function(data) {
    data = ['model'].concat(data);
    table[ data[1] ] = data;
    incomingHeatmapData.push(data);
    
    // Ugly timestamp adjustment
    if(!data[3] || data[3] == 'N/A') {
      data[3] == null;
    }
    else {
      var parts = data[3].split('/').concat(data[4].split(':')).map(function(token) { return parseInt(token, 10); });
      if(/pm/.test(data[4]) && parts[3] != 12) {
        parts[3] += 12;
      }
      data[3] = Date.UTC(parts[2], parts[0] - 1, parts[1], parts[3], parts[4]);
    }
    data[4] = null;
    
    callback(data);
  });
  
  function requestFunction(symbols) {
    return function(cb) {
      // setTimeout(function() {// DEBUG
      request(
        'http://download.finance.yahoo.com/d/quotes.csv?s=' + symbols.join(',') + '&f=sl1d1t1c1pohgvp2j1a2jk',
        function(error, response, body) {
          if(error || response.statusCode >= 400) {
            if(error) console.error(error);
            else console.error("Can't request stocks. Response status code is " + response.statusCode);
            return cb();
          }
          
          quoteReader.parse(body);
          cb();
        }
      );
    // }, Math.random() * 4000);// DEBUG
    };
  }
}