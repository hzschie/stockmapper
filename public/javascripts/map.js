(function() {
  function Map($map, models) {
    var $shadows = $(document.createElement('div')).addClass('shadows').appendTo($map);
    models.bind('add', addModel);
    
    function addModel(model) {
      var sym = model.get('sym'),
          html;
      if(sym.indexOf('-') > -1) {
        var splt = sym.split('-');
        html = splt[0] + '<span>' + splt[1] + '</span>';
      } else {
        html = sym;
      }
      
      var $tag = $(document.createElement('li')).html(html).appendTo($map),
          $shadow = $(document.createElement('li')).appendTo($shadows);
      model.on('change', function(model) {
        if(model.hasChanged('change')) {
          var pct = model.get('changePct'),
              whiteness = Math.round(0xff * ( 1 - Math.abs( Math.min(5, Math.max(-5, pct)) / 5) )),
              rgb = [pct < 0 ? 0xff : whiteness, pct > 0 ? 0xff : whiteness, whiteness];
            
          $tag.css({
            backgroundColor: 'rgb(' + rgb + ')'
          });
        }
        if(model.hasChanged('isVeryActive')) {
          if(model.get('isVeryActive')) {
            $tag.addClass('active');
            $shadow.addClass('active');
          }
          else {
            $tag.removeClass('active');
            $shadow.removeClass('active');
          }
        }
      });
    }
  };
  
  mapper.Map = Map;
})();