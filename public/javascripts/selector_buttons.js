(function() {
  mapper.SelectorButtons = SelectorButtons;
  var NONE = 'none';
  SelectorButtons.NONE = NONE;
  function SelectorButtons($container, callback, allowDeselect) {
    var $current;
    $('> a', $container).each(function() {
      $(this).on('click', function() {
        if($(this).hasClass('disabled')) return false;
        var selectorId = $(this).attr('id');
        if($current && $current.attr('id') == selectorId && allowDeselect) callback(NONE);
        else callback(selectorId);
      });
    });
    
    this.setCurrent = function(id) {
      $next = id == NONE ? null : $('#' + id, $container);
      if($current && $next && $current[0] == $next[0]) return $next;
      $current && $current.removeClass('current');
      $current = $next;
      $next && $next.addClass('current');
      return $next;
    };
  }
})();