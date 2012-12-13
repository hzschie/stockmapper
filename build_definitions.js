var dataDomain = process.env.DATA_DOMAIN;
if(!dataDomain) {
  console.error('ERROR: Missing DATA_DOMAIN envirnment param.');
  process.exit();
}

var ansi = require('ansi'),
    fs = require('fs'),
    builder = require('./lib/domains/' + dataDomain + '/definitions_builder');

// DETECT IF RUNNING AS STANDALONE SCRIPT, OR AS MODULE IMPORTED
// BY THE MAIN APP (FOR DYNAMIC REFRESHING)
if(require.main === module) {
  cursor = ansi(process.stdout);
  builder.build(
    cursor,
    function(definitions) {
      Object.keys(definitions).forEach(function(key) {
        fs.writeFileSync(
          __dirname + '/public/data/' + dataDomain + '/' + key + '.json',
          JSON.stringify( definitions[key] )
        );
      });
    }
  );
}
else {
  var events = require('events');
  function Builder() {
    var _this = this;
    this.update = function(req, res) {
      if(res) {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        cursor = ansi(res);
      }
      else {
        cursor = ansi(process.stdout);
      }
      builder.build(
        cursor,
        function(definitions) {
          _this.emit('update', definitions);
          if(res) res.end();
        }
      );
    };
  }
  Builder.prototype = Object.create(events.EventEmitter.prototype, {
    constructor: {
      value: Builder,
      enumerable: false
    }
  });
  module.exports = new Builder();
}