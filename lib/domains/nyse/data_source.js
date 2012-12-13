var path = require('path'),
    basePath = path.dirname(require.main.filename);

module.exports = require(basePath + '/lib/yahoo_data_source.js');