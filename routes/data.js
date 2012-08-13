var dataSourceClass;
switch(process.env.DATA_DOMAIN) {
  case 'blufin':
    dataSourceClass = require(__dirname + '/../lib/blufin_data_source.js').BlufinDataSource;
    break;
  case 'nyse':
    dataSourceClass = require(__dirname + '/../lib/yahoo_data_source.js').YahooDataSource;
    break;
}

var io;// Gets assigned via setter, below

var dataSource = new dataSourceClass(function(data) {
  io.sockets.emit("update", Array.isArray(data[0]) ? data : [data]);
});

exports.getIntraday = function(req, res) {
  dataSource.getIntraday(
    req.params.id,
    function(data) { res.json(data); }
  );
};

exports.getDaily = function(req, res) {
  dataSource.getDaily(
    req.params.id,
    function(data) { res.json(data); }
  );
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