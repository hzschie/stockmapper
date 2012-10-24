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
  
  this.deleteBefore = function(field, timestamp) {
    // console.log('deleteBefore:',timestamp);
    timestamp = Number(timestamp);
    if(!timestamp) return this;
    
    var index = headers.indexOf(field);
    if(index < 0) return this;

    for(var i = this.data.length - 1; i >= 0; i--) {
      if(this.data[i][index] <= timestamp) {
        // console.log('splice',this.data.length,'to',i+1);
        this.data.splice(0, i+1);
        // console.log('yields:',this.data.length);
        // console.log('this:',this);
        return this;
      }
    }
    return this;
  };
  
  this.sortOnField = function(field) {
    var index = headers.indexOf(field);
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