(function() {
  mapper.GraphRange = GraphRange;
  function GraphRange($ranges, callback) {
    var $range = $('.selected', $ranges);
    $ranges.children().click(function() {
      callback( $(this).attr('id') );
    });
    
    this.setRange = function(range) {
      if($range) $range.removeClass('selected');
      $range = $('#' + range, $ranges);
      $range.addClass('selected');
    };
  }
})();