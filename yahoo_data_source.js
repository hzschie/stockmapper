var http = require('http'),
    csv = require('ya-csv');

function YahooDataSource(callback) {
  var table = {},
      queue = {};
      
  this.get = function(id, socket) {
    var current = table[id];
    if(current) {
      return current;
    }
    else if(!queue[id]) {
      queue[id] = 1;
    }
  };
  
  var reader = csv.createCsvStreamReader(null, {
    'separator': ',',
    'quote': '"',
    'escape': '"',       
    'comment': ''
  });
  reader.addListener('data', function(data) {
    table[ data[0] ] = data;
    callback(data);
  });
  setInterval(function() {
    var count = 0,
        ids = [];
    for(var id in queue) {
      if(queue[id] == 0) continue;
      ids.push(id);
      queue[id] = 0;
      if(++count >= 99) break;
    }
    if(ids.length > 0) {
      var buffer = '';
      var req = http.get({
          host: 'download.finance.yahoo.com',
          port: 80,
          path: '/d/quotes.csv?f=sl1d1t1c1ohgvp2j1a2&s=' + ids.join('+')
        },
        function(response) {
          response.setEncoding('utf8');
          response.on('data', function(chunk) {
            buffer += chunk;
            var idx = buffer.lastIndexOf('\r\n'),
                ready = buffer.substring(0, idx+2);
                
            buffer = buffer.substring(idx+2);
            reader.parse(ready);
          });
        }
      ).on('error', function(e) {
        console.log('problem with request: ' + e.message);
      });
    }
  }, 200);
}
exports.YahooDataSource = YahooDataSource;