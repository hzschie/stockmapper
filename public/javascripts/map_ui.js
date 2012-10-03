(function() {
  mapper.MapHighlights = MapHighlights;
  
  function MapHighlights($container) {
    var $performance = $('.panel .performance', $container);
    
    // DEFINITIONS OF HIGHLIGHTERS
    mapper.highlighters = {
      active: new ActivityHighlighter(null, $('.panel .active', $container)),
      best: new PerformanceHighlighter(
        {
          type: "Best",
          val: .95,
          period: 'p52wk'
        },
        $('<div class="best performance content">' + $performance.html() + '</div>').appendTo($performance.parent()),
        $('#best')
      ),
      worst: new PerformanceHighlighter(
        {
          type: "Worst",
          val: .95,
          period: 'p52wk'
        },
        $performance.addClass('worst'),
        $('#worst')
      )
    };
    
    // The "NONE" highlighter
    mapper.highlighters[mapper.SelectorButtons.NONE] = {
      fn: function() { return false; },
      ready: function(callback) { callback(); },
      on: function() {},// no-op
      off: function() {}// no-op
    };
    
    var currentType = 'active',
        selector = new mapper.SelectorButtons($container, setHighlightType, true),
        $panel = $('.panel', $container).fadeOut(),
        $plus = $('.plus', $container),
        
        _this = this;
        
    setHighlightType(currentType);
        
    $plus.click(function() {
      if($panel.hasClass('disabled')) _this.showPanel();
      else _this.hidePanel();
    });
    
    this.showPanel = function() {
      $panel.removeClass('disabled');
      $panel.fadeIn(150);
      $plus.addClass('minus');
    };
    
    this.hidePanel = function() {
      $panel.fadeOut(150, function() { $panel.addClass('disabled'); });
      $plus.removeClass('minus');
    };
    
    function setHighlightType(id) {
      if(currentType) mapper.highlighters[currentType].off('change');
      
      currentType = id;
      selector.setCurrent(currentType);
      
      mapper.highlighters[currentType].on('change', updateModels);

      $panel.children().removeClass('current');
      $panel.find('.' + currentType).addClass('current');
      
      updateModels();
    }
    
    function updateModels() {
      var highlighter = mapper.highlighters[currentType];
      highlighter.ready(
        function() {
          $container.removeClass('pending');
          var fn = highlighter.fn;
          mapper.stocks.each(function(s) {
            s.setHighlightFunc(fn);
          });
        },
        function() {
          setTimeout(function() {
            $container.addClass('pending');
          },0);
          var fn = function() { return false; };
          mapper.stocks.each(function(s) {
            s.setHighlightFunc(fn);
          });
        }
      );
    }
  }
  
  function ActivityHighlighter(opts, $ui) {
    _.extend(this, Backbone.Events);
    var slider = new mapper.SliderAndInput(
          new mapper.Slider(
            $('.slider', $ui), 
            mapper.config.minVeryActiveRatio,
            mapper.config.maxVeryActiveRatio,
            mapper.config.veryActiveRatio
          ),
          $('input', $ui)
        ),
        _this = this;
        
    updateVal(mapper.config.veryActiveRatio, true);
    slider.on('change_val', updateVal);
    
    this.fn = function(model) {
      return model.get('volume') / (model.get('avgVolume') || model.get('volume')) >= _this.val;
    };
    
    this.ready = function(callback) { callback(); };
    
    function updateVal(val, silent) {
      _this.val = val;
      if(slider.val() != _this.val) slider.val(_this.val);
      if(!silent) _this.trigger('change');
    }
  }
  
  PerformanceHighlighter.periodProps = {
    p10yr: 'tyhl',
    p52wk: 'ftwhl',
    pYTD: 'ytdhl',
    p1mo: 'mhl',
    p1wk: 'whl'
  };
  function PerformanceHighlighter(opts, $ui, $btn) {
    _.extend(this, Backbone.Events);
    var periods = new mapper.SelectorButtons($('.periods', $ui), updatePeriod),
        slider = new mapper.SliderAndInput(
          new mapper.Slider($('.slider', $ui), .9, 1),
          $('input', $ui)
        ),
        $metrics = $('.metric', $ui),
        periodProp,
        _this = this;
    
    if(opts.type == 'Best') {
      this.fn = function(model) {
        var periodLowOrHigh = model.get(periodProp);
        return periodLowOrHigh && (model.get('lastTrade') / periodLowOrHigh.h >= _this.val);
      };
    }
    else {
      this.fn = function(model) {
        var periodLowOrHigh = model.get(periodProp);
        return periodLowOrHigh && (periodLowOrHigh.l / model.get('lastTrade') >= _this.val);
      };
    }
    
    this.ready = function(callback, pendingCallback) {
      if(mapper.stocks.datasets.low_high) callback();
      else {
        pendingCallback();
        mapper.stocks.acquireDataset('low_high', { idPropName: 'cid', callback: callback });
      }
    };
    
    updatePeriod(opts.period, true);
    updateVal(opts.val, true);
    slider.on('change_val', updateVal);
    
    function updatePeriod(id, silent) {
      _this.period = id;
      periodProp = PerformanceHighlighter.periodProps[_this.period];
      
      var periodTxt = periods.setCurrent(id).text();
      $btn.text(periodTxt + ' ' + opts.type);
      $metrics.eq(opts.type == 'Best' ? 0 : 1).text('current price');
      $metrics.eq(opts.type == 'Best' ? 1 : 0).text(periodTxt + ' ' + (opts.type == 'Best' ? 'high' : 'low') + ' price');
      
      if(!silent) _this.trigger('change');
    }
    
    function updateVal(val, silent) {
      _this.val = val;
      if(slider.val() != _this.val) slider.val(_this.val);
      if(!silent) _this.trigger('change');
    }
  }
})();