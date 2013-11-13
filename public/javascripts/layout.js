(function() {
  mapper.Layout = Layout;
  function Layout(groups, indexDetails, viewSelector, map, chart, inspector, stockDetails) {
    _.extend(this, Backbone.Events);
    var $window = $(window),
        $help = $('.help'),
        $about = $('.about'),
        $layout = $('.layout'),
        $panel = $('.wrapper > .panel'),
        $index = $('#index_details'),
        $map = map.$container.parent(),
        $title = $('.title', $map),
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
      Layout.toggleSidePanel($help)
    };
    $('.close', $help).click(Layout.toggleHelp);

    Layout.toggleSidePanel = function($content) {
      $content = $content || $('')
      if($layout.hasClass('open_sidepanel')) {
        $content.fadeOut({
          complete: function() {
            $layout.removeClass('open_sidepanel');
            onResize(true);
          }
        });
      }
      else {
        $layout.addClass('open_sidepanel');
        onResize(true);
        setTimeout(function() {
          $content.fadeIn();
        }, 400);
      }
    };
    $('.close', $help).click(Layout.toggleSidePanel);

    Layout.toggleAbout = function() {
      if($about.parent().hasClass('open')) {
        $about.fadeOut({
          complete: function() {
            $about.parent().removeClass('open');
            onResize(false);
          }
        });
      }
      else {
        $about.parent().addClass('open');
        $about.fadeIn({
          complete: function() {
            onResize(false);
          }
        });
      }
    };
    // $('.close', $help).click(Layout.toggleSidePanel);
    
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
    
    this.frameTag = function($tag) {
      scrollTo($tag.offset().top - collapsedTopLine() - 40);
    };
    
    var $currentView = null, 
        vvv;
    function onScroll(e) {
      var scrollTop = $window.scrollTop(),
          bodyHeight = $(document).height(),
          mapTop = $map.offset().top;
          
      if(mapTop == 0) return;// Not ready

      var y = Math.max(topLine(), scrollTop + collapsedTopLine()),
          _$currentView,
          view;
      
      if(!mapper.isTablet) {    
        if(y > mapTop) $title.addClass('fixed').css({ top: collapsedTopLine() });
        else $title.removeClass('fixed').css({ top: '' });
      }

      // console.log(y, '>', $chart.offset().top - 55,'|',mapTop,'|',$index.offset().top);
      if(y >= $chart.offset().top - 55) {
        _$currentView = $chart;
        view = 'chart';
      }
      else if(y >= mapTop || $index.is('.disabled')) {
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
    
    function bottomLine() {
      return $window.height() - ($stockDetails.is('.disabled') ? 0 : $stockDetails.outerHeight());
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
      inspector.setBottomConstraint(bottomLine());
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