(function() {
  mapper.Layout = Layout;
  function Layout(groups, indexDetails, map, chart, inspector, stockDetails) {
    _.extend(this, Backbone.Events);
    var $window = $(window),
        $help = $('.help'),
        $layout = $('.layout'),
        $panel = $('.panel'),
        $map = $('.map'),
        $chart = $('.chart'),
        $stockDetails = $('#stock_details'),
        $views = $panel.find('.views'),
        _this = this;
        
    $layout.css({ 'margin-top': topLine() });
    $chart.css({ 
      'min-height': $window.height() - $panel.outerHeight() - 42 - 20,
      'padding-bottom': 20
    });
    
    $window.scroll(onScroll);
    
    detectResize($window, resize);
    
    map.on('transition_done', function() {
      onScroll();
    });
    
    stockDetails.on('open', function() { inspector.setBottomConstraint($window.height() - $stockDetails.outerHeight()); });
    stockDetails.on('close', function() { inspector.setBottomConstraint($window.height()); });
    

    $views.children().each(function(i, el) {
      $(el).on('click', function() {
        var view = $(el).text().toLowerCase();
        _this.frameView(view);
        _this.trigger('select_view', view);
      });
    });
    
    Layout.toggleHelp = function() {
      if($layout.hasClass('open_help')) {
        $help.fadeOut({
          complete: function() {
            $layout.removeClass('open_help');
            resize(true);
          }
        });
      }
      else {
        $layout.addClass('open_help');
        resize(true);
        setTimeout(function() {
          $help.fadeIn();
        }, 400);
      }
    };
    $('.close', $help).click(Layout.toggleHelp);
    
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
      return $panel.outerHeight() + 11;
    }
    
    function resize(justLayout) {
      if(!justLayout) {
      
        Interval.callOnce({
          key:'resize_groups',
          fn:function() {
            groups.resize();
            $layout.css({ 'margin-top': topLine() });
            $chart.css({ 
              'min-height': $window.height() - $panel.outerHeight() - 42 - 20,
              'padding-bottom': 20
            });
          }
        }, Interval.PRIORITY_LOW);
      
        Interval.callOnce({
          key:'resize_stock_details',
          fn:function() { stockDetails.resize(); }
        }, Interval.PRIORITY_LOW);
        
      }
      
      Interval.callOnce({
        key:'resize_index_details',
        fn:function() { indexDetails.resize(); }
      }, Interval.PRIORITY_LOW);

      Interval.callOnce({
        key:'resize_map',
        fn:function() { map.resize(); }
      }, Interval.PRIORITY_LOW);

      Interval.callOnce({
        key:'resize_chart',
        fn:function() { chart.resize(); }
      }, Interval.PRIORITY_LOW);
      
      inspector.setBottomConstraint($window.height() - ($stockDetails.is(':visible') ? $stockDetails.outerHeight() : 0));
    }
    
    
    // ------ RESIZE DETECTION ------
    
    var timeoutId = null;
    function detectResize($window, handler) {
      $window.resize(function() {
        if(timeoutId != null) clearTimeout(timeoutId);
        timeoutId = setTimeout(function() {
          timeoutId = null;
          handler();
        }, 200);
      });
    }
  }
})();