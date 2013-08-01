// [ 'model',
//   'XAR',
//   '82.5999',
//   1375196580000,
//   null,
//   '+0.0299',
//   '82.57',
//   '82.79',
//   '82.79',
//   '82.40',
//   '852',
//   '+0.04%',
//   'N/A',
//   '2195',
//   '57.70',
//   '90.13' ]
var http = require('http');
var allStocksData = {};
var allStocks = [];
var DataSource = require(__dirname + '/data_source.js'),
	  dataSource = new DataSource(function(data) {      
  		allStocksData[data[1]] = {
  			symbol:           data[1],
  			last_trade_price: +data[2],
        last_trade_date:  data[3],
        last_trade_time:  data[4],
        change:           +data[5],
        previous_close:   +data[6],
        open:             +data[7],
        day_high:         +data[8],
        day_low:          +data[9],
        more_info:        data[10],
        change_percent:   data[11],
        market_cap:       data[12],
        avg_daily_volume: +data[13],
        week_52_low:      +data[14],
        week_52_high:     +data[15],
  		};
	  });

function propComparator(prop) {
  return function(a, b) {
      return b[prop] - a[prop];
  }
}

function toArray(){
  var result = [];
  for(var key in allStocksData)
    result.push(allStocksData[key]);
  return result;
}

module.exports = function(app) {
  ['home', 'partners', 'about', 'composite', 'mapper', 'demo'].forEach(function(pageId, i) {
    app.get('/' + pageId + '.html', function(req, res) {
      res.render(
        'domains/foreside/' + pageId,
        {
          currentPage: pageId
        }
      );
    });
  })

  app.get('/etfcomp_quote/:id', function(req, res) {
  	var id = req.params.id.toUpperCase();
    res.json(allStocksData[id]);
  });

  app.get('/gainers/:field?/:count?', function(req, res) {
    var field = req.params.field;
    allStocks = toArray();  
    allStocks.sort(propComparator(field));
    var count = req.params.count;
    var result = allStocks.slice(0, count);
    res.json(result);
  });

  app.get('/losers/:field?/:count?', function(req, res) {
    var field = req.params.field;
    allStocks = toArray();
    allStocks.sort(propComparator(field));
    var count = req.params.count;
  	var result = allStocks.slice(allStocks.length - count - 1).reverse();
  	res.json(result);
  });

  app.get('/etf50_quote/:id?', function(req, res){
    res.json({'last_trade_price': 138.35, 'change': 2.10, 'change_percent': '+1.25%'});
  });

  app.get('/etf25_quote/:id?', function(req, res){
    res.json({'last_trade_price': 238.33, 'change': -1.10, 'change_percent': '+1.25%'});
  });
};