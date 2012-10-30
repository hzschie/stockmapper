var strftime = require('strftime').strftimeUTC;

var LogUtil = module.exports = {
  timestampFormat:'UTC %m-%d-%Y %H:%M:%S: ',
  timestamp: function(optDate) {
    return strftime(LogUtil.timestampFormat);
  },
  
  paramString: function(params) {
    return Object.keys(params).map(function(param, i) { return (i == 0 ? '?' : '&') +  param + '=' + params[param]; }).join('');
  },
  
  cantGet: function(topic, paramsOrId, errorOrResponseStatusCode, url) {
    var output = LogUtil.timestamp() + 'Can\'t get ' + topic + ' for ';
    
    if(typeof(paramsOrId) == 'string') output += paramsOrId;
    else output += LogUtil.paramString(paramsOrId);
    
    output += '. ';
    
    if(params == null) output += '(no params)';
    else if(isNaN(errorOrResponseStatusCode)) output += String(errorOrResponseStatusCode);
    else output += 'Response status code is ' + errorOrResponseStatusCode;
    
    output += '. Url: ' + url;
    
    return output;
  }
};