$.browser.iPhone = navigator.userAgent.match(/iPhone/i) !== null;
$.browser.iPad = navigator.userAgent.match(/iPad/i) !== null;
$.browser.iOS = $.browser.iPhone || $.browser.iPad;
$.browser.android = navigator.userAgent.match(/android/i) !== null;
$.browser.touchDevice = $.browser.android || $.browser.iOS;
$.browser.firefox = navigator.userAgent.match(/firefox/i) !== null;

mapper.perf = {
  optimizeDataInit: $.browser.msie || mapper.isMobile
};
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
    if(progressive) return mapper.fractionChangeToHex(fraction);
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

  
  mapper.Grid = function(_n, bw, _w, _h, makeCells, alwaysRemake) {
    var w, h, n, d,
        _this = this,
        cells,
        rotated = true;
        
    this.cellsClone = function() { return cells.concat(); };
    this.redefine = function(_n, _c, _r, _w, _h) {
      var nOld = n, cOld = this.cols;
      n = _n || n;
      this.cols = _c || this.cols;
      this.rows = _r || this.rows;
      w = _w || w;
      h = _h || h;

      if(alwaysRemake || n != nOld || this.cols != cOld) {
        cells = makeCells.apply(_this, [n, this.cols, this.rows, w, h]);
      }
      // console.log('n='+n, 'c='+c, 'r='+r, 'w='+w, 'h='+h);
    };
    
    this.n = function(_n) {
      _this.redefine(_n, null, Math.ceil(_n / this.cols), null, null);
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
    this.bounds = function() { return { w: this.cols * w, h: this.rows * h }; };
    
  };
  
  mapper.Template = Template;
  Template.blankIfNull = function(fn) { return function(val, model) { return val == null ? '' : fn(val, model); }; };
  Template.NaIfNaN = function(fn) { return function(val, model) { return isNaN(val) ? 'N/A' : fn(val, model); }; };
  Template.postfix = function(fn, postFix) { return function(val, model) { return (fn ? fn(val, model) : val) + postFix; }; };
  Template.makeRedOrGreen = function(val, $field) {
    $field.removeClass('red green');
    if(val) $field.addClass(val == 1 ? 'green' : 'red');
    return null;
  };
  Template.priceFormat = Template.NaIfNaN( d3.format(',.2f') );
  Template.commaFormat = Template.NaIfNaN( d3.format(',') );
  Template.changeFormat = Template.NaIfNaN( d3.format('+.2f') );
  Template.pctFormat = Template.NaIfNaN( Template.postfix(d3.format('.1f'), '%') );
  Template.pctChangeFormatter = function(formatStr) {
    var formatter = d3.format('+' + (formatStr || '.2f')),
        zeroFormatter = d3.format(formatStr || '.2f');
    return function(val) {
      return Template.NaIfNaN( Template.postfix(val == 0 ? zeroFormatter : formatter, '%') )(val);
    };
  };
  Template.metricFormat = function(val) {
    var unit = '';
    if(val >= 1e+12) {
      val /= 1e+12;
      unit = 'T';
    } else if(val >= 1e+9) {
      val /= 1e+9;
      unit = 'B';
    } else if(val >= 1e+6) {
      val /= 1e+6;
      unit = 'M';
    } else if(val >= 1e+3) {
      val /= 1e+3;
      unit = 'K';
    }
    
    return (Math.round(val * 10) / 10) + unit;
  };
  var timestampFormat = d3.time.format.utc('%b %d, %I:%M%p'),
      datestampFormat = d3.time.format.utc('%b %d, %Y');
  Template.timestamp = function(val) {
    if(!val) return null;
    if(typeof(val) == 'number') val = new Date(val);
    if(val.getUTCHours() == 0) {
      return datestampFormat(val);
    }
    return timestampFormat(val);
  };

  function Template(bindings) {
    this.bindings = bindings;
    
    this.getBindings = function(key) {
      return this.bindings[key];
    };
    
    this.applyBindings = function(bindings, $container, model) {
      if(typeof(bindings) == 'string') bindings = this.getBindings(bindings);
      _.forEach(bindings, function(binding) {
        if(!binding) return;
        var $field = binding.$ ? $container.find(binding.$) : $container,
            // val = (model.get && model.get(binding.field)) || (!model.get && model[binding.field]);
            val = model.get ? model.get(binding.field) : model[binding.field];

        val = (binding.formatter || String)( val, $field, model );
        if(val != null) $field.html(val);
      });
    };
    
  }
})();