(function() {
  mapper.Layout = Layout;
  function Layout(groups, indexDetails, viewSelector, map, chart, inspector, stockDetails) {
    _.extend(this, Backbone.Events);
    var $window = $(window),
        $help = $('.help'),
        $layout = $('.layout'),
        $panel = $('.wrapper > .panel'),
        $index = $('#index_details'),
        $map = map.$container.parent(),
        $chart = $('.chart'),
        $stockDetails = $('#stock_details'),
        panelMinHeight = parseInt($panel.css('min-height'), 10),
        panelMaxHeight = parseInt($panel.css('max-height'), 10),
        _this = this;
        
    $layout.css({ 'margin-top': topLine() });
    updateChartHeight();
    
    onScroll();
    $window.scroll(onScroll);
    
    detectResize($window, onResize);
    
    map.on('transition_done', function() {
      setTimeout(function() {
        onScroll();
        // if(vvv) _this.frameView(vvv);
      }, 500);
    });
    
    stockDetails.on('open', updateBottomConstraint);
    stockDetails.on('close', updateBottomConstraint);
    

    Layout.toggleHelp = function() {
      if($layout.hasClass('open_help')) {
        $help.fadeOut({
          complete: function() {
            $layout.removeClass('open_help');
            onResize(true);
          }
        });
      }
      else {
        $layout.addClass('open_help');
        onResize(true);
        setTimeout(function() {
          $help.fadeIn();
        }, 400);
      }
    };
    $('.close', $help).click(Layout.toggleHelp);
    
    this.frameView = function(viewName) {
      switch(viewName) {
        case 'chart':
          scrollTo($chart.offset().top - 45 - collapsedTopLine());
          break;
        case 'index':
          scrollTo($index.offset().top - collapsedTopLine());
          break;
        case 'map':
        default:
          scrollTo($map.offset().top - collapsedTopLine());
          break;
      }
    };
    
    var $currentView = null, 
        vvv;
    function onScroll(e) {
      var scrollTop = $window.scrollTop(),
          bodyHeight = $(document).height();

      var y = Math.max(topLine(), scrollTop + 10 + collapsedTopLine()) + 1,
          _$currentView,
          view;
          
      if(y >= $chart.offset().top - 45) {
        _$currentView = $chart;
        view = 'chart';
      }
      else if(y >= $map.offset().top) {
        _$currentView = $map;
        view = 'map';
      }
      else if(!$index.is('.disabled') && (y >= $index.offset().top)) {
        _$currentView = $index;
        view = 'index';
      }
      vvv = view;
      if(_$currentView && $currentView != _$currentView) {
        $currentView = _$currentView;
        viewSelector.setCurrent(view);
      }
      
      updateBottomConstraint();
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
      return (panelMaxHeight || $panel.outerHeight()) + 11;
    }

    function collapsedTopLine() {
      return (panelMinHeight || $panel.outerHeight()) + 11;
    }
    
    function onResize(justLayout) {
      if(!justLayout) {
      
        Interval.callOnce({
          key:'resize_groups',
          fn:function() {
            groups.resize();
            $layout.css({ 'margin-top': topLine() });
            updateChartHeight();
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
      
      updateBottomConstraint();
    }
    
    function updateChartHeight() {
      $chart.css({ 
        'min-height': $window.height() - (panelMinHeight || $panel.outerHeight()) - 85,
        'padding-bottom': 20
      });
    }
    
    function updateBottomConstraint() {
      inspector.setBottomConstraint($window.height() - ($stockDetails.is('.disabled') ? 0 : $stockDetails.outerHeight()));
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