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
        series_type = 'intraday',// 'daily',// 
        graph = new mapper.Graph($('.graph', $details));
    
    this.query = function(model) {
      template.applyBindings('stock', $details, model);
      model.acquireTimeSeries(series_type);
      model.on('change:' + series_type, function(model) {
        graph.render( model.get(series_type) );
      });
    };
  }
})();