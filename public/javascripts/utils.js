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
      whiteness = Math.round(0xff - 21.25 * Math.ceil(20 * magnitude));
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
})();