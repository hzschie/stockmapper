(function() {
  mapper.SortButtons = SortButtons;
  function SortButtons($sorts, callback) {
    var $current;
    $sorts.children().each(function() {
      $(this).on('click', function() {
        callback( $(this).attr('id') );
      });
    });
    
    this.setCurrent = function(id) {
      $next = $('#' + id, $sorts);
      if($current && $current[0] == $next[0]) return;
      $current && $current.removeClass('current');
      $current = $next.addClass('current');
    };
  }
})();