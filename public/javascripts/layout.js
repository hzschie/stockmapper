(function() {
  mapper.Layout = Layout;
  function Layout(panel, map, chart) {
    var $window = $(window),
        $panel = $('.panel'),
        $map = $('.map');
        $chart = $('.chart');
    $map.css({ 'margin-top': panel.height() + 14 });
    $chart.css({ 
      'min-height': $window.height() - panel.height() - 14 - 20,
      'padding-bottom': 20
    });
    
    $window.scroll(onScroll);
    
    this.frameView = function(viewName) {
      switch(viewName) {
        case 'chart':
          scrollTo($('.chart').offset().top - $('.map').offset().top);
          break;
        case 'map':
        default:
          scrollTo(0);
          break;
      }
    };
    
    function onScroll() {
      // console.log($window.scrollTop());
    }
    
    function scrollTo(y) {
      var $dummy = $('<div></div>'),
          $document = $(document);
      $dummy.css({ left:$document.scrollTop() });
      $dummy.animate(
        { left:y },
        {
          step: function() {
            $document.scrollTop(parseInt($(this).css('left'), 10));
          },
          complete: function() {
            $document.scrollTop(y);
          },
          easing:'swing'
        }
      );
    }
  }
})();