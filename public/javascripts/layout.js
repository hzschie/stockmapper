(function() {
  mapper.Layout = Layout;
  function Layout(panel, map, chart) {
    _.extend(this, Backbone.Events);
    var $window = $(window),
        $layout = $('.layout'),
        $panel = $('.panel'),
        $map = $('.map'),
        $chart = $('.chart'),
        $views = $panel.find('.views'),
        _this = this;
        
    $layout.css({ 'margin-top': topLine() });
    $chart.css({ 
      'min-height': $window.height() - panel.height() - 42 - 20,
      'padding-bottom': 20
    });
    
    $window.scroll(onScroll);
    map.on('transition_done', function() {
      onScroll();
    });

    $views.children().each(function(i, el) {
      $(el).on('click', function() {
        var view = $(el).text().toLowerCase();
        _this.frameView(view);
        _this.trigger('select_view', view);
      });
    });
    
    this.frameView = function(viewName) {
      switch(viewName) {
        case 'chart':
          scrollTo($chart.offset().top - $layout.offset().top - 5);
          break;
        case 'map':
        default:
          scrollTo($map.offset().top - $layout.offset().top);
          break;
      }
    };
    
    var $currentView = null;
    function onScroll() {
      var y = $window.scrollTop() + topLine(),
          _$currentView,
          view;
      if(y >= $chart.offset().top - 20) {
        _$currentView = $chart;
        view = 'CHART';
      }
      else if(y >= $map.offset().top) {
        _$currentView = $map;
        view = 'MAP';
      }
      
      if(_$currentView && $currentView != _$currentView) {
        $currentView = _$currentView;
        $views.children().removeClass('current');
        $views.find(':contains(' + view + ')').addClass('current');
      }
      
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
    
    function topLine() {
      return panel.height() + 42;
    }
  }
})();