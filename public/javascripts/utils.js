(function() {
  // Converts a value between -1 and 1 to a hex of red or green with corresponding intensity
  mapper.fractionToGreenRedHex = function(fraction, progressive) {
    if(progressive) return mapper.fractionChangeToHexProgressive(fraction);
    var whiteness = Math.round(0xff * ( 1 - Math.abs(fraction) ));
    return [fraction < 0 ? 0xff : whiteness, fraction > 0 ? 0xff : whiteness, whiteness];
  };
  
  mapper.changePctToHex = function(changePct) {
    return mapper.fractionChangeToHex(Math.min(5, Math.max(-5, changePct)) / 5);
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
})();