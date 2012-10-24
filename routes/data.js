var DataSource;
switch(process.env.DATA_DOMAIN) {
  case 'nyse':
  case 'foreside':
    DataSource = require(__dirname + '/../lib/yahoo_data_source.js');
    break;
  default:
    DataSource = require(__dirname + '/../lib/' + process.env.DATA_DOMAIN + '_data_source.js');
}

var io;// Gets assigned via setter, below

var dataSource = new DataSource(function(data) {
  io && io.sockets.emit("update", Array.isArray(data[0]) ? data : [data]);
});

exports.getTimeSeries = function(req, res) {
  req.query.id = req.params.id;
  if(!dataSource.getTimeSeries) return res.json(null);
  dataSource.getTimeSeries(req.query, function(data) { res.json(data); });
};
exports.getNews = function(req, res) {
  req.query.id = req.params.id;
  if(!dataSource.getNews) return res.json([]);
  dataSource.getNews(req.query, function(data) { res.json(data); });
};
exports.getDataset = function(req, res) {
  dataSource.getDataset(req.params.name, res);
};


exports.setIO = function(_io) {
  io = _io;
  io.sockets.on('connection', function (socket) {
    socket.on('subscribe', function (ids) {
      if(typeof(ids) == 'string') ids = [ids];
    
      var reply = [];
      ids.forEach(function(id) {
        socket.join(id);
        var current = dataSource.get(id);
        if(current) {
          reply.push(current);
        }
      });
      if(reply.length) {
        socket.emit("update", reply);
      }
    });
  });
};