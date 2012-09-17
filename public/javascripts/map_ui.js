(function() {
  mapper.MapHighlights = MapHighlights;
  function MapHighlights($container) {
    var currentType = 'active',
        selector = new mapper.SelectorButtons($container, setHighlightType, true),
        slider = new mapper.SliderAndInput(
          new mapper.Slider(
            $('.slider', $container), 
            mapper.config.minVeryActiveRatio, mapper.config.maxVeryActiveRatio, mapper.config.veryActiveRatio
          ),
          $('input', $container)
        ),
        $panel = $('.panel', $container).fadeOut(),
        $plus = $('.plus', $container),
        
        _this = this;
        
    setHighlightType(currentType);
        
    slider.on('change_val', function(val) {
      mapper.stocks.each(function(s) {
        s.set({
          veryActiveRatio: val,
          isVeryActive: s.get('volume') / (s.get('avgVolume') || s.get('volume')) >= val
        });
      });
    });
    
    $plus.click(function() {
      if($panel.hasClass('disabled')) {
        _this.showPanel();
      }
      else {
        _this.hidePanel();
      }
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
      currentType = id;
      selector.setCurrent(currentType);
      if(currentType == mapper.SelectorButtons.NONE) {
        console.log('none');
      }
    }
  }
})();