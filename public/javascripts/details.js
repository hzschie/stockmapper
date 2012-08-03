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
        graph = new mapper.Graph($('.graph', $details));
    
    this.query = function(model) {
      template.applyBindings('stock', $details, model);
      model.getTimeSeries();
      model.on('change:price_series', function(model) {
        console.log(model.get('price_series'));
        graph.render(model.get('price_series'));
      });
    };
  }
})();