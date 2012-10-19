(function() {
  mapper.Compare = Compare;
  function Compare($compare) {
    _.extend(this, Backbone.Events);
    var $selection = $('.selection', $compare),
        search = new mapper.Search($('.search', $compare), { dropdownNorth: true }),
        selection = [],
        series_type = null,
        _this = this;
    
    search.on('commit_option', addComparison);
    
    this.getSelection = function() { return selection; };
    this.isActive = function() { return selection.length > 0; };
    
    this.setSeriesType = function(type) { series_type = type; };
    
    function addComparison(model) {
      if(!model || $.inArray(model, selection) > -1) return;
      
      selection.push(model);
      update();
      
      search.clear();
      
      prepareAllSeries();
    }
    
    function prepareAllSeries() {
      var numReady = 0;
      $.each(selection, function(i, model) {
        if(model.get(series_type)) numReady++;
        else model.acquireTimeSeries(series_type, prepareAllSeries);
      });
      
      if(numReady == selection.length) _this.trigger('change_selection');
    }
    
    function removeComparison(model) {
      selection.splice($.inArray(model, selection), 1);
      update();
    }
    
    function update() {
      $selection.empty();
      $.each(selection, function(i, model) {
        $('<div class="compare_to">' + model.get('sym') + '<span class="x"></span></div>')
          .appendTo($selection)
          .find('.x').click(function() { removeComparison(model); });
      });
    }
  }
})();