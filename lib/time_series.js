module.exports = function(headers, sourceData, extract) {
  var _this = this;
  this.headers = headers;
  this.data = [];
  
  this.addSlice = function(slice) {
    this.data.push(slice);
    this.headers.forEach(function(h, i) {
      var val = slice[i];
      if(val != null) {
        _this[h + '_min'] = ((_this[h + '_min'] == null) ? val : Math.min(_this[h + '_min'], val));
        _this[h + '_max'] = ((_this[h + '_max'] == null) ? val : Math.max(_this[h + '_max'], val));
      }
    });
  };
  
  if(sourceData) {
    sourceData.forEach(function(slice) {
      _this.addSlice(extract(slice));
    });
  }
};