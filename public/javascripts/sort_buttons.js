(function() {
  mapper.SortButtons = SortButtons;
  function SortButtons($sorts, callback) {
    var $current;
    $('a', $sorts).each(function() {
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