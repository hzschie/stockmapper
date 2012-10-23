(function() {
  // ASSUMES THE DATA COMES CHRONOLOGICALLY SORTED
  mapper.TimeSeries = TimeSeries;
  function TimeSeries(def, type) {
    $.extend(this, def);
    
    var output,
        headers = def.headers,
        len = headers.length,
        _this = this;
    
    this.type = type;
    
    this.data = [];
    (this.append = function(rawData) {
      $.each(rawData, function(j, row) {
        var datum = {};
        for(var i=0; i < len; i++) {
          var field = headers[i],
              val = row[i];
          datum[ field ] = val;

          if(val != null) {
            _this[field + '_min'] = ((_this[field + '_min'] == null) ? val : Math.min(_this[field + '_min'], val));
            _this[field + '_max'] = ((_this[field + '_max'] == null) ? val : Math.max(_this[field + '_max'], val));
          }
        }
        _this.data.push(datum);
      });
    })(def.data);
    
    this.getMin = function(field, range) { return getMinOrMax('min', field, range); };
    this.getMax = function(field, range) { return getMinOrMax('max', field, range); };
    
    this.hasData = function(t0, t1) {
      for(var i = 0, len = this.data.length; i < len; i++) {
        if(this.data[i].t >= t0 && this.data[i].t <= t1) return true;
      }
      return false;
    };
    
    this.getNearestSlice = function(t) {
      if(!this.data || this.data.length == 0) return null;
      
      var min = 0,// earliest
          max = this.data.length - 1,// latest
          i = 0;
          
      while(++i) {
        if(max - min == 1) return Math.abs(this.data[max].t - t) < Math.abs(this.data[min].t - t) ? this.data[max] : this.data[min];
        cur = Math.floor(.5 * (max + min));
        if(this.data[cur].t > t) max = cur;
        else if(this.data[cur].t < t) min = cur;
        else return this.data[cur];
        
        if(i > 40) throw new Error('Too much recursion');
      }
    };
    
    this.getTimestamp = function() {
      var lastSlice = this.data[this.data.length - 1];
      return lastSlice && lastSlice.t;
    };

    function getMinOrMax(minOrMax, field, range) {
      if(range && (Number(range[0]) != _this.t_min || Number(range[1]) != _this.t_max)) {
        var output;
        $.each(_this.data, function(i, slice) {
          if(slice.t >= range[0] && slice.t <= range[1]) {
            output = output == null ? slice[field] : Math[minOrMax](output, slice[field]);
          }
        });
        return output;
      }
      
      if(_this[field + '_ref']) return Math[minOrMax](_this[field + '_ref'], _this[field + '_' + minOrMax]);
      else return _this[field + '_' + minOrMax];
    };
  }
})();