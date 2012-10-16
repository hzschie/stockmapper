(function() {
  mapper.Slider = Slider;
  
  // Extracts mouse coordinates in a device-dependant way
  Slider.extractPageX = function(event) {
    var src = $.browser.touchDevice ? (event.changedTouches || event.originalEvent.changedTouches)[0] : event;
    return src.pageX;
  };
  
  function Slider($container, vMin, vMax, val) {
    _.extend(this, Backbone.Events);
    
    vMin = vMin == null ? 0 : vMin;
    vMax = vMax == null ? 1 : vMax;
    val = val == null ? vMin + .5 * (vMax - vMin) : val;

    var $track = $('<div class="track"></div>').appendTo($container).on($.browser.touchDevice ? 'touchstart' : 'click', dragChange),
        $thumb = $('<div class="thumb"></div>').appendTo($container).on($.browser.touchDevice ? 'touchstart' : 'mousedown', startDrag),
        
        thumbW = $thumb.width(),
        sliderW = $container.width() - thumbW,
        
        _this = this;
        
    update();
    
    this.val = function(_val) {
      if(_val == null) return val;
      val = _val;
      update();
    };
    
    function update() {
      $thumb.css({
        left: Math.max(0, Math.min(sliderW, sliderW * (val - vMin) / (vMax - vMin))),
        opacity: val < vMin || val > vMax ? .4 : 1
      });
    }
    
    var localX,
        isDragged = false;
    function startDrag(event) {
      isDragged = true;
      localX = Slider.extractPageX(event) - $thumb.offset().left;
      $(document).on($.browser.touchDevice ? 'touchmove' : 'mousemove', dragChange);
      $(document).on($.browser.touchDevice ? 'touchend' : 'mouseup', endDrag);
      event.preventDefault();
    }

    function dragChange(event) {
      var mouseX = Slider.extractPageX(event) - $container.offset().left - (this == $track[0] ? thumbW/2 : localX);
      val = Math.min(vMax, Math.max(vMin,    vMin + (vMax - vMin) * (mouseX / sliderW)   ));
      update();
      event.preventDefault();
      
      // Use interval here to allow the slider to move smoothly,
      // independat of whether the event-listening method takes
      // a very long time to complete.
      Interval.callOnce({
        key: 'trigger_slider_change',
        fn: function() {
          _this.trigger('change_val', val);
        }
      }, Interval.MID);
    }

    function endDrag(event) {
      dragChange(event);
      localX = null;
      isDragged = false;
      $(document).off($.browser.touchDevice ? 'touchmove' : 'mousemove', dragChange);
      $(document).off($.browser.touchDevice ? 'touchend' : 'mouseup', endDrag);
    }
  }
  
  mapper.SliderAndInput = SliderAndInput;
  function SliderAndInput(slider, $input) {
    _.extend(this, Backbone.Events);
    var _this = this;
    update(slider.val(), true);
    
    slider.on('change_val', function(val) {
      update(val);
    });
    
    $input.on('change', function() {
      update($input.val());
    });
    
    function update(val, skipEvent) {
      $input.val( mapper.Template.priceFormat(val) );
      slider.val(val);
      if(!skipEvent) _this.trigger('change_val', val);
    }
    
    this.val = function(val) {
      if(val == null) return slider.val();
      update(val);
    };
  }
})();