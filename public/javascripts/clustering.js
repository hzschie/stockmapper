(function() {
  mapper.ClusteringSelector = ClusteringSelector;
  function ClusteringSelector($clustering, callback) {
    var $panel = $('.panel', $clustering),
        panel = new mapper.WidgetPanel( $panel,  $('.plus', $clustering ), $clustering, $clustering),
        $display = $('.selection .display', $clustering),
        selector = new mapper.SelectorButtons($panel, function(id) {
          callback(id == mapper.SelectorButtons.NONE ? null : id);
        }),
        _this = this;
        
    // $clustering.click(function() {
    //   panel.toggle();
    // });
        
    this.setCurrent = function(id) {
      selector.setCurrent(id || mapper.SelectorButtons.NONE);
      $display.text($('.current', $clustering).text() || '(Invalid Selection)');
    };
  }
})();