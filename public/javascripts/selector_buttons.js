(function() {
  mapper.SelectorButtons = SelectorButtons;
  function SelectorButtons($container, callback) {
    var $current;
    $('a', $container).each(function() {
      $(this).on('click', function() {
        callback( $(this).attr('id') );
      });
    });
    
    this.setCurrent = function(id) {
      $next = $('#' + id, $container);
      if($current && $current[0] == $next[0]) return;
      $current && $current.removeClass('current');
      $current = $next.addClass('current');
    };
  }
})();