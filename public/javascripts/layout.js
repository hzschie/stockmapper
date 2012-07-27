(function() {
  mapper.Layout = Layout;
  function Layout(panel, map, chart) {
    var $window = $(window),
        $panel = $('.panel'),
        $map = $('.map');
        $chart = $('.chart');
    $chart.css({ 'margin-top': panel.height() + 14 });
    $map.css({ 
      'min-height': $window.height() - panel.height() - 14 - 20,
      'padding-bottom': 20
    });
    
    $window.scroll(scroll);
    
    function scroll() {
      // console.log($window.scrollTop());
    }
  }
})();