(function() {
  mapper.GlobalLastUpdate = GlobalLastUpdate;
  function GlobalLastUpdate($container, models) {
    var $value = $('.value', $container),
        lastUpdate = _.max(models.models, function(m) { return m.get('timestamp'); }).get('timestamp');
    update(null);
    models.on('change:timestamp', update);
    
    function update(model) {
      if(model) {
        if(lastUpdate >= model.get('timestamp')) return;
        else lastUpdate = model.get('timestamp');
      }
      
      Interval.callOnce({
        key: 'global_last_update',
        fn: function() {
          $container.css({ opacity:1 });
        }
      }, Interval.LOW);
      $value.text(mapper.Template.timestamp(lastUpdate) + ' ' + mapper.config.marketHours.timezone);
    }
  }
})();