(function() {
  mapper.WidgetPanel = WidgetPanel;
  function WidgetPanel($panel, $plus, $containment, $invoker) {
    var _this = this;
    
    ($invoker || $plus).click(function() {
      _this.toggle();
    });
    
    this.show = function() {
      $panel.removeClass('disabled');
      $panel.fadeIn(150);
      $plus.addClass('minus');
      $(document).on('mousedown', dismiss);
    };
    
    this.hide = function() {
      $(document).unbind('mousedown', dismiss);
      $panel.fadeOut(150, function() { $panel.addClass('disabled'); });
      $plus.removeClass('minus');
    };
    
    this.toggle = function() {
      if($panel.hasClass('disabled')) this.show();
      else this.hide();
    };
    
    this.setContent = function(selector) {
      $panel.children().removeClass('current');
      $panel.find(selector).addClass('current');
    };
    
    // Closure for document mousedown
    function dismiss(e) {
      if(($containment || $panel).has(e.target).length == 0 ) _this.hide();
    };
    
  }
})();