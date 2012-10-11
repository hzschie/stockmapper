(function() {
  mapper.SelectorButtons = SelectorButtons;
  var NONE = 'none';
  SelectorButtons.NONE = NONE;
  function SelectorButtons($container, callback, allowDeselect) {
    var $current;
    $('> a', $container).each(function() {
      $(this).on('click', function() {
        if($(this).hasClass('disabled')) return false;
        var selectorId = $(this).data('val');
        if($current && $current.data('val') == selectorId && allowDeselect) callback(NONE);
        else callback(selectorId);
      });
    });
    
    this.setCurrent = function(id) {
      var $next = id == NONE ? null : $('a[data-val=' + id + ']', $container);
      if($current && $next && $current[0] == $next[0]) return $next;
      $current && $current.removeClass('current');
      $current = $next;
      $next && $next.addClass('current');
      return $next;
    };
    
    this.enable = function(id) { $('a[data-val=' + id + ']', $container).removeClass('disabled'); };
    this.disable = function(id) { $('a[data-val=' + id + ']', $container).addClass('disabled'); };
  }
})();