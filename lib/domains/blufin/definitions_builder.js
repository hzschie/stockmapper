var fs = require('fs'),
    request = require('request'),
    flow = require('nimble'),
    ansi = require('ansi'),
    LogUtil = require('../../log_util');

module.exports = (function() {
  if(!process.env.DATA_HOST) throw new Error('Missing Environment Variable DATA_HOST (e.g. DATA_HOST=54.251.130.77:8080)');

  var verbose = /true/i.test(process.env.VERBOSE),
      urlBase = 'http://' + process.env.DATA_HOST + '/Service/equities.svc/',
      groupsTable,
      groups,
      stocks,
      cursor = null;

  function reset(callback) {
    stocks = [];
    groups = [];
    groupsTable = {};
    callback();
  }
  
  function createGroups(callback) {
    cursor
      .hex('#00ff00')
      .bold()
      .write('Building definitions...\n')
      .reset();

    var url = urlBase + 'GetBlufinIndexList';
    request(url, function(error, response, body) {
      if(error || response.statusCode >= 400) {
        cursor.hex('#cc0000').write('');
        console.error( LogUtil.cantGet('GetBlufinIndexList', null, error || response.statusCode, url) );
        return callback();
      }

      var groupsJson = JSON.parse(body);

      // Log
      verbose && cursor.hex('#00ff00').bold().write(groupsJson.length + ' groups\n').reset();

      // Gather required properties for each group and index it by group id
      groupsJson.forEach(function(group, i) {
        var groupId = group.id;// IndexId

        // Log
        verbose && cursor
          .hex('#6666ff').write(String(group.id))
          .hex('#3333aa').write(' (' + group.n + ')\n');

        groups.push(
          groupsTable[groupId] = {
            id: groupId,
            name: group.n,// IndexName
            nickname: group.n.replace(/^blufin /i, '').replace(/ index$/i, '').replace(/ and /, ' & '),
            category: group.c,// Category
            ids: [],
            resourceParams: 'resource=index&blufin=true'
          }
        );
      });

      // Hardcoded creation of NIFTY and SENSEX groups
      groups.push(
        groupsTable['nifty'] = {
          id: 229,
          name: 'NIFTY',
          nickname: 'NIFTY',
          sym: 'NIFTY',
          category: 'Index',
          type: 'index',
          ids: [],
          resourceParams: 'resource=index&nse=true'
        },
        
        groupsTable['sensex'] = {
          id: 201,
          name: 'SENSEX',
          nickname: 'SENSEX',
          sym: 'SENSEX',
          category: 'Index',
          type: 'index',
          ids: [],
          resourceParams: 'resource=index'
        }
      );

      callback();
    });
  }

  /* Request GetLatestIndexDatabyIndexId, to extract "type":"INDEX" or "LIST", since that's not available in GetBlufinIndexList */
  function applyGroupType(callback) {
    var url = urlBase + 'GetLatestIndexDatabyIndexId?IndexID=0';

    request(url, function(error, response, body) {
      if(error || response.statusCode >= 400) {
        cursor.hex('#cc0000').write('');
        console.error( LogUtil.cantGet('GetLatestIndexDatabyIndexId', null, error || response.statusCode, url) );
        return callback();
      }
      var groupsJson = JSON.parse(body);
      groupsJson.forEach(function(groupJson) {
        var id = groupJson.id,
            group = id && groupsTable[id];
        if(group) {
          if(groupJson.type == 'INDEX') group.type = 'index';// Otherwise, type is left blank, implying type of "group"
        }
      });

      callback();
    });
  }

  function createStocks(callback) {
    request(urlBase + 'GetLatestIndexConstituentsDataByIndexID?IndexID=1000', function(error, response, body) {
      if(error || response.statusCode >= 400) {
        cursor.hex('#cc0000').write('');
        console.error( LogUtil.cantGet('index constituents', 'IndexId=1000', error || response.statusCode, url) );
        return callback();
      }

      var stocksRaw = JSON.parse(body),
          broadGroup = groupsTable['1000'],
          niftyGroup = groupsTable['nifty'],
          sensexGroup = groupsTable['sensex'];

      // Log
      verbose && cursor.hex('#00ff00').bold().write('\n' + stocksRaw.length + ' stocks\n').reset();

      stocksRaw.forEach(function(stock) {
        var sym = stock.s;// ScripId
        stocks.push( [stock.cid, stock.n, sym, 'type=stock&nse=' + (stock.nse == 1)] );//[ScripCode, ScripName, sym, resourceParams]

        var sector = stock.sec,// Sector
            capitalization = stock.c,// Capitalization
            style = stock.st,// Style
            crosstab = (capitalization + ' ' + style),
            isNifty = stock.nifty == 1,
            isSensex = stock.sensex == 1;

        // Log
        verbose && cursor
          .hex('#6666ff').write('\n' + stock.s)
          .hex('#3333aa').write(' (' + stock.n + '):\n');

        for(var indexId in groupsTable) {
          var group = groupsTable[indexId];
          if(group.name == sector || group.name == capitalization || group.name == style || group.name == crosstab || 
              group == broadGroup || (isNifty && group == niftyGroup) || (isSensex && group == sensexGroup)) {
            group.ids.push(stock.cid);// ScripCode

            // Log
            verbose && cursor
              .hex('#3333aa').write('Add ')
              .hex('#6666ff').write(stock.s)
              .hex('#3333aa').write(' to ')
              .hex('#6666ff').write(group.name + '\n');
          }
        }

      });
  /*
      verbose && cursor
        .hex('#6666ff').write('IndexId ' + indexId + ' (' + group.name + ')')
        .hex('#3333aa').write(' ids: ' + group.ids.join(',') + '\n');
  */

      callback();
    });
  }
  
  return {
    build: function(_cursor, callback) {
      cursor = _cursor;
      flow.series([
        reset,
        createGroups,
        applyGroupType,
        createStocks,
        function() {
          cursor
            .hex('#00ff00')
            .bold()
            .write(LogUtil.timestamp() + 'Definitions built successfully!\n')
            .reset();

          if(groups.length == 0 || stocks.length == 0) {
              cursor.hex('#cc0000')
              .write(LogUtil.timestamp() + 'However, definitions appear to be empty!\n')
              .reset();
          }
          
          callback && callback({ stocks:{ headers:['id', 'name', 'sym', 'resourceParams'], data:stocks }, groups:groups });
        }
      ]);
    }
  };
})();

    


