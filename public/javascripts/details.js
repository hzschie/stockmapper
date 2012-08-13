(function() {
  mapper.Details = Details;
  var Template = mapper.Template;
  Details.defaultBindings = {
    stock: [
      { $:'.sym', field:'sym' },
      { $:'.name', field:'name' }
    ]
  };
  
  function Details($details) {
    var template = new mapper.Template(Details.defaultBindings),
        series_type = 'daily',// 'intraday',// 'daily',// 
        graph = new mapper.Graph($('.graph', $details));
    
    this.query = function(model) {
      if(!model) {
        $details.css({ 
          // height: 0,
          opacity:0 
        });
        return;
      }
      
      $details.show().css({
        // height: 440,
        opacity:0
      });
      
      template.applyBindings('stock', $details, model);
      
      if(model.get(series_type)) {
        $details.css({ opacity:1 });
        graph.render( model.get(series_type) );
      }
      model.acquireTimeSeries(series_type);
      model.on('change:' + series_type, function(model) {
        $details.css({ opacity:1 });
        graph.render( model.get(series_type) );
      });
    };
  }
})();