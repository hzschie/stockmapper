$.browser.iPhone = navigator.userAgent.match(/iPhone/i) !== null;
$.browser.iPad = navigator.userAgent.match(/iPad/i) !== null;
$.browser.iOS = $.browser.iPhone || $.browser.iPad;
$.browser.android = navigator.userAgent.match(/android/i) !== null;
$.browser.touchDevice = $.browser.android || $.browser.iOS;
$.browser.firefox = navigator.userAgent.match(/firefox/i) !== null;

mapper.perf = {};
if($.browser.touchDevice) {
  mapper.perf.mapDelayMult = 0;//150;//0;//80;
  mapper.perf.chartDelayMult = 0;//2500;//0;//1500;
  mapper.perf.animate = false;
}
else if($.browser.firefox) {
  mapper.perf.mapDelayMult = 60;
  mapper.perf.chartDelayMult = 1000;
}
else {
  mapper.perf.mapDelayMult = 20;
  mapper.perf.chartDelayMult = 400;
}

(function() {
  // Converts a value between -1 and 1 to a hex of red or green with corresponding intensity
  mapper.fractionToGreenRedHex = function(fraction, progressive) {
    if(progressive) return mapper.fractionChangeToHexProgressive(fraction);
    var whiteness = Math.round(0xff * ( 1 - Math.abs(fraction) ));
    return [fraction < 0 ? 0xff : whiteness, fraction > 0 ? 0xff : whiteness, whiteness];
  };
  
  mapper.changePctToHex = function(changePct, bound) {
    bound = bound || 5;
    return mapper.fractionChangeToHex(Math.min(bound, Math.max(-bound, changePct)) / bound);
  };

  mapper.fractionChangeToHex = function(fraction) {
    var magnitude = Math.abs(fraction),
        whiteness;
    if(magnitude <= .4) {
      // whiteness = Math.round(0xff - 21.25 * Math.ceil(20 * magnitude));
      whiteness = Math.round(0xff - 21.25 * Math.ceil(20 * Math.sqrt(magnitude / .4) * .4));
    }
    else {
      whiteness = Math.round(21.25 * Math.ceil(5 * (1 - magnitude)));
    }
    // return [fraction < 0 ? 0xff : whiteness, fraction > 0 ? 0xff : whiteness, whiteness];
    
    if(fraction < 0)
      return '#' + (0xff0000 + (whiteness << 8) + whiteness).toString(16);
    else
      return '#' + (0x1000000 + (whiteness << 16) + 0xff00 + whiteness).toString(16).substring(1);
  };
  
  mapper.capitalize = function(str) {
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
  };

  
  mapper.Grid = function(_n, bw, _w, _h, makeCells) {
    var c, r, w, h, n, d,
        _this = this,
        cells,
        rotated = true;
        
    this.cellsClone = function() { return cells.concat(); };
    this.redefine = function(_n, _c, _r, _w, _h) {
      var nOld = n;
      n = _n || n;
      c = this.cols = _c || c;
      r = this.rows = _r || r;
      w = _w || w;
      h = _h || h;

      if(n != nOld) {
        cells = makeCells(n, c, r);
      }
      // console.log('n='+n, 'c='+c, 'r='+r, 'w='+w, 'h='+h);
    };
    
    this.n = function(_n) {
      _this.redefine(_n, null, Math.ceil(_n / c), null, null);
    };
    
    (this.nwBound = function(_n, bw, _w, _h) {
      var _c = Math.floor(bw / _w),
          _r = Math.ceil(_n / _c);
      _this.redefine(_n, _c, _r, _w, _h);
    })(_n, bw, _w, _h);
    
    this.c = function(i) { return cells[i][0]; };
    this.r = function(i) { return cells[i][1]; };

    this.x = function(_c) { return _c * w; };
    this.y = function(_r) { return _r * h; };
    this.xi = function(i) { return _this.x( _this.c(i) ); };
    this.yi = function(i) { return _this.y( _this.r(i) ); };
    this.bounds = function() { return { w: c * w, h: r * h }; };
  };
  
  mapper.Template = Template;
  Template.blankIfNull = function(fn) { return function(val, model) { return val == null ? '' : fn(val, model); }; };
  Template.NaIfNaN = function(fn) { return function(val, model) { return isNaN(val) ? 'N/A' : fn(val, model); }; };
  Template.postfix = function(fn, postFix) { return function(val, model) { return fn(val, model) + postFix; }; };
  Template.makeRedOrGreen = function(val, $field) {
    $field.removeClass('red green');
    if(val) $field.addClass(val == 1 ? 'green' : 'red');
    return null;
  };
  Template.priceFormat = Template.NaIfNaN( d3.format(',.2f') );
  Template.commaFormat = Template.NaIfNaN( d3.format(',') );
  Template.changeFormat = Template.NaIfNaN( d3.format('+.2f') );
  Template.pctFormat = Template.NaIfNaN( Template.postfix(d3.format('.1f'), '%') );
  Template.metricFormat = function(val) {
    if(val >= 1e+12)
      return val / 1e+12 + 'T';
    else if(val >= 1e+9)
      return val / 1e+9 + 'B';
    else if(val >= 1e+6)
      return val / 1e+6 + 'M';
    else if(val >= 1e+3)
      return val / 1e+3 + 'K';
    else
      return String(val);
  };

  function Template(bindings) {
    this.bindings = bindings;
    
    this.getBindings = function(key) {
      return this.bindings[key];
    };
    
    this.applyBindings = function(bindings, $container, model) {
      if(typeof(bindings) == 'string') bindings = this.getBindings(bindings);
      _.forEach(bindings, function(binding) {
        var $field = binding.$ ? $container.find(binding.$) : $container,
            val = (model.get && model.get(binding.field)) || (!model.get && model[binding.field]);

        val = (binding.formatter || String)( val, $field, model );
        if(val != null) $field.html(val);
      });
    };
    
  }
})();