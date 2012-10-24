(function() {
  mapper.GlobalLastUpdate = GlobalLastUpdate;
  // Expects models to be a Collection or an Array of Collections
  function GlobalLastUpdate($container, models) {
    var $value = $('.value', $container),
        lastUpdate;
    
    $.each(
      models instanceof Array ? models : [models],
      function(i, modelCollection) {
        var mostRecentlyUpdated = _.max(modelCollection.models, function(m) { return m.get('timestamp'); });
        lastUpdate = mostRecentlyUpdated && mostRecentlyUpdated.get('timestamp');
        modelCollection.on('change:timestamp', update);
      }
    );
    update(null);
    
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
      
      if(lastUpdate) {
        $value.text(mapper.Template.timestamp(lastUpdate) + ' ' + mapper.config.marketHours.timezone);
      }
    }
  }
})();