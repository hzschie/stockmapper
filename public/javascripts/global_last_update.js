(function() {
  mapper.GlobalLastUpdate = GlobalLastUpdate;
  function GlobalLastUpdate($field, models) {
    var lastUpdate = _.max(models.models, function(m) { return m.get('timestamp'); }).get('timestamp');
    update(null);
    console.log(lastUpdate, new Date(lastUpdate).toUTCString());
    models.on('change:timestamp', update);
    
    function update(model) {
      if(model) {
        if(lastUpdate >= model.get('timestamp')) return;
        else lastUpdate = model.get('timestamp');
      }
      
      $field.text(mapper.Template.timestamp(lastUpdate) + ' ' + mapper.config.marketHours.timezone);
    }
  }
})();