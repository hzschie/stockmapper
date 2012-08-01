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
    var template = new mapper.Template(Details.defaultBindings);
    this.query = function(model) {
      template.applyBindings('stock', $details, model);
    };
  }
})();