var TimeSeries = module.exports = function(headers, sourceData, extract) {
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
  
  this.concat = function(other) {
    var output = new TimeSeries(this.headers);
    output.data = this.data.concat(other.data);
    this.headers.forEach(function(h, i) {
      output[h + '_min'] = ((_this[h + '_min'] == null) ? other[h + '_min'] : Math.min(_this[h + '_min'], other[h + '_min']));
      output[h + '_max'] = ((_this[h + '_max'] == null) ? other[h + '_max'] : Math.max(_this[h + '_max'], other[h + '_max']));
    });
    return output;
  };
  
  if(sourceData) {
    sourceData.forEach(function(slice) {
      _this.addSlice(extract(slice));
    });
  }
};