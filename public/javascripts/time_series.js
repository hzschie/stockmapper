(function() {
  mapper.TimeSeries = TimeSeries;
  function TimeSeries(def, prop) {
    var data = this.data = def[prop],
        len = data.length,
        cur, min, max;
    for(var i = 0; i < len; i++) {
      cur = data[i];
      if(cur == null) {
        cur = data[i] = data[i-1];
      }
      if(i == 0) {
        min = cur;
        max = cur;
      }
      else if(cur != null) {
        min = Math.min(min, cur);
        max = Math.max(max, cur);
      }
    }
    this.min = min;
    this.max = max;
    this.prop = prop;
    $.extend(this, def);
  }
})();