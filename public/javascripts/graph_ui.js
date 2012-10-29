(function() {
  mapper.Compare = Compare;
  function Compare($compare, graph) {
    _.extend(this, Backbone.Events);
    var $selection = $('.selection', $compare),
        search = new mapper.Search($('.search', $compare), { dropdownNorth: true }),
        main = null,
        $main = $('.main.compare_to', $compare),
        selection = [],
        series_type = null,
        palette = ["#d62728", "#2ca02c", "#ff7f0e", "#9467bd", "#8c564b"],
        _this = this;
    
    search.on('commit_option', addComparison);
    
    this.getSelection = function() { return selection; };
    this.isActive = function() { return selection.length > 0; };
    
    this.setSeriesType = function(type) {
      series_type = type;
      if(selection.length == 0) return;
      _.each(selection, acquire);
    };
    
    this.setMain = function(model) {
      if(main) {
        main.off('start_update_time_series', update);
        main.off('update_time_series', update);
      }
      
      main = model;
      main.on('start_update_time_series', update);
      main.on('update_time_series', update);
      
      selection = [];
      update();
    };
    
    function addComparison(model) {
      if(!model || $.inArray(model, selection) > -1) return;
      
      selection.push(model);
      // Trim selection to be, at most, as long as the palette array, in a first-in-first-out manner.
      if(selection.length > palette.length) {
        selection.splice(0, selection.length - palette.length);
      }
      model.on('update_time_series', update);
      model.on('change:timestamp', acquire);
      acquire(model);
      update();
      
      search.clear();
    }
    
    function acquire(model) {
      model.acquireTimeSeries(series_type);
    }
    
    function removeComparison(model) {
      model.off('update_time_series', update);
      model.on('off:timestamp', acquire);
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
      $.each(selection.concat(main), function(i, model) {
        var series = model.get(series_type),
            $label;
        if(model == main) $label = $main;
        else {
          $label = $('<div class="compare_to"></div')
            .html($main.html())
            .css({ color:model._compare.color })
            .appendTo($selection);
            
          $label.find('.x')
            .css({ backgroundColor: model == main ? null : model._compare.color })
            .click(function() { removeComparison(model); });
            
          if(series) series.color = model._compare.color;
        }
        
        if(!series || series.isPending) $label.addClass('pending');
        else $label.removeClass('pending');
        
        $label.find('.sym').text(model.get('sym'));
        
        var $val = $('.value', $label);
        if(model.get(series_type)) {
          callbacks.push(function(val) {
            if(model == main) { $compare[val == null ? 'removeClass' : 'addClass']('inspected'); }
            $val.text(d3.format('+.1f')(val) + '%');
          });
        };
      });
      graph.changeGraph.compareWith(availableSeries, callbacks);
    }
  }
})();