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
var allStocks = [];
var DataSource = require(__dirname + '/data_source.js'),
	dataSource = new DataSource(function(data) {
		// console.log(data[0]);
		// loop over data {
			// var sym = row[1]
			// allStocks[data[1]] = {
			// 	price: data[2]
			// }
			allStocks.push({
				symbol:           data[1],
				last_trade_price: data[2],
        last_trade_date:  data[3],
        last_trade_time:  data[4],
        change:           data[5],
        previous_close:   data[6],
        open:             data[7],
        day_high:         data[8],
        day_low:          data[9],
        more_info:        data[10],
        change_percent:   data[11],
        market_cap:       data[12],
        avg_daily_volume: data[13],
        week_52_low:      data[14],
        week_52_high:     data[15],
			});
		// }
	});

  function propComparator(prop) {
    return function(a, b) {
        return b[prop] - a[prop];
    }
  }

	
// setTimeout(function(){
// 			// console.log(allStocks);
// 	allStocks.sort(function(a,b){return b.last_trade_price - a.last_trade_price});
// 	console.log(allStocks);
// }, 3000);



module.exports = function(app) {
  app.get('/foo', function(req, res) {
     res.json({foo: allStocks[0]});
    });

  app.get('/active/:id', function(req, res) {
  	var id = req.params.id.toUpperCase();
  	var result = {};
  	for(var i = 0; i < allStocks.length; i++){
  		if(id == allStocks[i].symbol.toUpperCase()){
  			result = allStocks[i];
  			break;
  		}
  	}
    res.json(result);
  });

  // app.get('/gainers/:count?', function(req, res) {
  // 	var count = req.params.count;
  // 	var result = allStocks.slice(0, count);
  // 	res.json(result);
  // });

  app.get('/gainers/:field?/:count?', function(req, res) {
    var field = req.params.field;
    // if(typeof allStocks[0].field * 1 == NaN){
    //   res.json({'message': 'cannot compare'});
    //   return;
    // }
    allStocks.sort(propComparator(field));
    var count = req.params.count;
    var result = allStocks.slice(0, count);
    res.json(result);
  });

  app.get('/losers/:field?/:count?', function(req, res) {
    var field = req.params.field;
    allStocks.sort(propComparator(field));
    var count = req.params.count;
  	var result = allStocks.slice(allStocks.length - count - 1).reverse();
  	res.json(result);
  });

};