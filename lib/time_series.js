var TimeSeries = module.exports = function(headers, sourceData, extract) {
  var _this = this;
  this.headers = headers;
  this.data = [];
  
  this.addSlice = function(slice) {
    this.data.push(slice);
  };
  
  this.concat = function(other) {
    var output = new TimeSeries(this.headers);
    output.data = this.data.concat(other.data);
    return output;
  };
  
  this.sortOnField = function(index) {
    this.data = this.data.sort(function(a, b) {
      return (a[index] > b[index]) - (a[index] < b[index]);
    });
  };
  
  if(sourceData) {
    sourceData.forEach(function(slice) {
      _this.addSlice(extract(slice));
    });
  }
};