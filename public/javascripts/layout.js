(function() {
  mapper.Layout = Layout;
  function Layout(panel, map, chart) {
    var $window = $(window),
        $panel = $('.panel'),
        $chart = $('.chart');
    $chart.css({ 'margin-top': panel.height() + 14 });
    
    $window.scroll(scroll);
    
    function scroll() {
      // console.log($window.scrollTop());
    }
  }
})();