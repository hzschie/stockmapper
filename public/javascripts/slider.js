(function() {
  mapper.Slider = Slider;
  function Slider($container, vMin, vMax, val) {
    _.extend(this, Backbone.Events);
    
    vMin = vMin == null ? 0 : vMin;
    vMax = vMax == null ? 1 : vMax;
    val = val == null ? vMin + .5 * (vMax - vMin) : val;
    
    var $track = $('<div class="track"></div>').appendTo($container).click(dragChange),
        $thumb = $('<div class="thumb"></div>').appendTo($container).mousedown(startDrag),
        
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
      localX = event.pageX - $thumb.offset().left;
      $(document).on('mousemove', dragChange);
      $(document).on('mouseup', endDrag);
      event.preventDefault();
    }

    function dragChange(event) {
      var mouseX = event.pageX - $container.offset().left - (this == $track[0] ? thumbW/2 : localX);
      val = Math.min(vMax, Math.max(vMin,    vMin + (vMax - vMin) * (mouseX / sliderW)   ));
      update();
      _this.trigger('change_val', val);
    }

    function endDrag(event) {
      dragChange(event);
      localX = null;
      isDragged = false;
      $(document).off('mousemove', dragChange);
      $(document).off('mouseup', endDrag);
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
  }
})();