(function() {
  mapper.Compare = Compare;
  function Compare($compare) {
    var $selection = $('.selection', $compare),
        search = new mapper.Search($('.search', $compare), { dropdownNorth: true }),
        selection = [];
    
    search.on('commit_option', addComparison);
    
    function addComparison(model) {
      selection.push(model);
      update();
    }
    
    function update() {
      $selection.html(
        $.map(selection, function(model, i) {
          return '<div>' + model.get('sym') + '<span class="x"></span></div>';
        }).join('')
      );
    }
  }
})();