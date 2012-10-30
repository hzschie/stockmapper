(function() {
  // Configurable Stuff:
  var timezone = mapper.config.marketHours.timezone,
      getDetailsBindings = mapper.config.getDetailsBindings;
  
  mapper.Details = Details;
  var Template = mapper.Template;
  Details.defaultBindings = {
    stock: [
      { $:'.header .sym', field:'sym' },
      { $:'.name', field:'name' },
      { $:'.last_trade', field:'lastTrade', formatter:Template.priceFormat },
      { $:'.timestamp .value', field:'timestamp', formatter:Template.postfix(Template.timestamp, ' ' + timezone) },

      { $:'.change', field:'changeDir', formatter:Template.makeRedOrGreen },
      { $:'.change .amount', field:'change', formatter:Template.changeFormat },
      { $:'.change .percent', field:'changePct', formatter:Template.postfix(Template.changeFormat, '%') },

      { $:'.open', field:'open', formatter:Template.priceFormat },
      { $:'.high', field:'high', formatter:Template.priceFormat },
      { $:'.low', field:'low', formatter:Template.priceFormat },
      
      { $:'.avg_volume', field:'avgVolume', formatter:Template.commaFormat },
      { $:'.volume', field:'volume', formatter:Template.commaFormat },
      { $:'.market_cap', field:'marketCap', formatter:Template.metricFormat }
    ],
    index: [
      { $:'.name', field:'name' },
      { $:'.last_trade', field:'lastTrade', formatter:Template.priceFormat },
      { $:'.timestamp .value', field:'timestamp', formatter:Template.postfix(Template.timestamp, ' ' + timezone) },
      
      { $:'.change', field:'changeDir', formatter:Template.makeRedOrGreen },
      { $:'.change .amount', field:'change', formatter:Template.changeFormat },
      { $:'.change .percent', field:'changePct', formatter:Template.postfix(Template.changeFormat, '%') },
      
      { $:'.previous', field:'previous', formatter:Template.priceFormat },
      { $:'.open', field:'open', formatter:Template.priceFormat },
      { $:'.high', field:'high', formatter:Template.priceFormat },
      { $:'.low', field:'low', formatter:Template.priceFormat }
    ]
  };
  
  function Details($details, opts) {
    _.extend(this, Backbone.Events);
    var _this = this,
    
        model = null,
        series_type = 'intraday',
    
        template = new mapper.Template(
          $.extend(
            Details.defaultBindings,
            getDetailsBindings ? getDetailsBindings(Details.defaultBindings) : {}
          )
        ),
        graph = new mapper.Graph($('.graph', $details), $('.left', $details).width() + 20, opts),
        graphRange = new mapper.SelectorButtons($('.graph .ui .ranges'), function(id) { _this.trigger('select_range', id); }),
        
        $compare = $('.compare', $details),
        compare = $compare.length == 1 ? new mapper.Compare($compare, graph) : null,
        
        $news = $('.news', $details),
        news = $news.length == 1 ? new mapper.News($news) : null;
        
        $close = $('.close', $details);

    if($close.length == 1) $close.click(function() { _this.trigger('click_close'); });
    
    this.close = function() {
      $details.addClass('disabled');
      this.trigger('close');
    };
    
    this.query = function(_model) {
      if(model) model.off('change', updateQuote);
      
      model = _model;
      if(!model) {
        this.close();
        return;
      }
      $details.removeClass('disabled');
      this.trigger('open');
      
      if(model) model.on('change', updateQuote);
      updateQuote();
      
      if(news) {
        news.setPending(true);
        model.acquireNews(function(data) { news.render(data); });// News feed
      }
      
      compare && compare.setMain(model);
      
      this.updateGraph();
    };
    
    this.setRange = function(range) {
      range = range || 'r1d';
      graphRange.setCurrent(range);
      graph.setRange(range);

      if(range == 'r1d') series_type = 'intraday';
      else if(range == 'r5d') series_type = '5day';
      else series_type = 'daily';
      
      this.updateGraph();
      compare && compare.setSeriesType(series_type);
    };
    
    this.updateGraph = function() {
      graph.setPending(true);
      Interval.callOnce({
        key: 'update_graph_' + (model ? model.id : ''),
        fn: function() {
          model && model.acquireTimeSeries(series_type, function(series) { graph.render(series); });
        }
      });
    };
    
    this.resize = function(explicitW) {
      var w;
      if(explicitW != null) w = explicitW;
      else if($details.is(':visible')) w = $('.left', $details).width();
      else {
        $details.show();
        w = $('.left', $details).width();
        $details.hide();
      }
      graph.setWidth(w);
    };
    
    function updateQuote() {
      if(!model.get('hasData')) return;
      
      if(model.hasChanged('timestamp')) {
        model.acquireTimeSeries(series_type, function(series) { graph.render(series); });
      }
      
      $details.find('.content').removeClass('current');
      $details.find('.' + model.get('type')).addClass('current');
      
      template.applyBindings(model.get('type'), $details, model);
    }
  }
})();