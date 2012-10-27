(function() {
  mapper.Compare = Compare;
  function Compare($compare, graph) {
    _.extend(this, Backbone.Events);
    var $selection = $('.selection', $compare),
        search = new mapper.Search($('.search', $compare), { dropdownNorth: true }),
        selection = [],
        series_type = null,
        palette = ["#d62728", "#2ca02c", "#ff7f0e", "#9467bd", "#8c564b"],
        _this = this;
    
    search.on('commit_option', addComparison);
    
    this.getSelection = function() { return selection; };
    this.isActive = function() { return selection.length > 0; };
    
    this.setSeriesType = function(type) {
      series_type = type;
    };
    
    function addComparison(model) {
      if(!model || $.inArray(model, selection) > -1) return;
      
      selection.push(model);
      // Trim selection to be, at most, as long as the palette array, in a first-in-first-out manner.
      if(selection.length > palette.length) {
        selection.splice(0, selection.length - palette.length);
      }
      model.acquireTimeSeries(series_type, update);
      update();
      
      search.clear();
    }
    
    function removeComparison(model) {
      selection.splice($.inArray(model, selection), 1);
      update();
    }
    
    function update() {
      $selection.empty();
      
      if(selection.length > 0) {
        graph.enableChangeGraph();
        
        var availableSeries = $.map(selection, function(model) { return model.get(series_type); }),
            usedColors = $.map(selection, function(model) {
              model._compare = model._compare || {};
              return model._compare.color;
            }),
            unusedColors = _.difference(palette, usedColors);

        // If model has a pre-assigned color that is already in use, we need to reassign it a new color
        if(usedColors.length != _.uniq(usedColors).length) {
          var duplicateColor = _.find( _.zip(usedColors, _.uniq(usedColors)), function(pair) { return pair[0] != pair[1]; })[0],
              duplicateModel = _.find(selection.concat().reverse(), function(model) { return model._compare.color == duplicateColor; });

          duplicateModel._compare.color = unusedColors.shift();
        }
        $.each(selection, function(i, model) { if(!model._compare.color) model._compare.color = unusedColors.shift(); });
      }
      else return graph.disableChangeGraph();
      
      var callbacks = [];
      $.each(selection, function(i, model) {
        var series = model.get(series_type);
        if(series) series.color = model._compare.color;
        
        var $label = $('<div class="compare_to' + (!series ? ' pending' : '') + '">' + model.get('sym') + '<span class="x"></span><span class="value"></span></div>')
          .appendTo($selection)
          .css({ color:model._compare.color });
        
        $label.find('.x')
          .css({ backgroundColor: model._compare.color })
          .click(function() { removeComparison(model); });
        
        var $val = $('.value', $label);
        if(model.get(series_type)) {
          callbacks.push(function(val) {
            if(val == null) return $label.removeClass('inspected');
            else $label.addClass('inspected');
            $val.text(d3.format('+.1f')(val) + '%');
          });
        };
      });
      
      graph.changeGraph.compareWith(availableSeries, callbacks);
    }
  }
})();