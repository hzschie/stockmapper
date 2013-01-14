(function() {
  mapper.DropdownSelector = DropdownSelector;
  function DropdownSelector($container, callback) {
    var $panel = $('.panel', $container),// the down-dropped panel, with options
        panel = new mapper.WidgetPanel( $panel,  $('.plus', $container ), $container, $container),
        $display = $('.display', $container),// the selected value display
        selector = new mapper.SelectorButtons($panel, function(id) {
          callback(id == mapper.SelectorButtons.NONE ? null : id);
        }),
        _this = this;
        
    this.setCurrent = function(id) {
      selector.setCurrent(id || mapper.SelectorButtons.NONE);
      $display.text($('.current', $container).text() || '(Invalid Selection)');
    };
  }
})();