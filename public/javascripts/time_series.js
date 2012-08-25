(function() {
  mapper.TimeSeries = TimeSeries;
  function TimeSeries(def, type) {
    $.extend(this, def);
    
    var output,
        headers = def.headers,
        len = headers.length;
    this.data = $.map(this.data, function(row) {
      output = {};
      for(var i=0; i < len; i++) {
        output[ headers[i] ] = row[i];
      }
      return output;
    });
    this.type = type;

    this.data.sort(function(a,b) { return (a.t < b.t) - (a.t > b.t); });
    
    // this.data = $.map(this.data, function(slice) { var s2=$.extend({},slice); s2.t-=864e5; return s2; }).concat(this.data);//TEMP
    // this.t_min -= 864e5;//TEMP
  }
})();