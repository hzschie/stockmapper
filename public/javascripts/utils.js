(function() {
  // Converts a value between -1 and 1 to a hex of red or green with corresponding intensity
  mapper.fractionToGreenRedHex = function(fraction, progressive) {
    if(progressive) return mapper.fractionChangeToHexProgressive(fraction);
    var whiteness = Math.round(0xff * ( 1 - Math.abs(fraction) ));
    return [fraction < 0 ? 0xff : whiteness, fraction > 0 ? 0xff : whiteness, whiteness];
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
    return [fraction < 0 ? 0xff : whiteness, fraction > 0 ? 0xff : whiteness, whiteness];
  };
})();