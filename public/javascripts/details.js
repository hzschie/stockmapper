(function() {
  mapper.Details = Details;
  var Template = mapper.Template;
  Details.defaultBindings = {
    stock: [
      { $:'.sym', field:'sym' },
      { $:'.name', field:'name' },
      { $:'.last_trade', field:'lastTrade', formatter:Template.priceFormat },
      { $:'.timestamp .value', field:'timestamp', formatter:Template.postfix(Template.timestamp, ' ' + mapper.config.marketHours.timezone) },

      { $:'.change', field:'changeDir', formatter:Template.makeRedOrGreen },
      { $:'.change .amount', field:'change', formatter:Template.changeFormat },
      { $:'.change .percent', field:'changePct', formatter:Template.postfix(Template.changeFormat, '%') },

      { $:'.open', field:'open', formatter:Template.priceFormat },
      { $:'.high', field:'high', formatter:Template.priceFormat },
      { $:'.low', field:'low', formatter:Template.priceFormat },
      
      { $:'.avg_volume', field:'avgVolume', formatter:Template.commaFormat },
      { $:'.volume', field:'volume', formatter:Template.commaFormat },
      { $:'.market_cap', field:'marketCap', formatter:Template.postfix(Template.commaFormat, 'Cr') },// Blufin Specific. Non Should be Template.metricFormat

      { $:'.pe', field:'pe', formatter:Template.priceFormat },
      { $:'.pb', field:'pb', formatter:Template.priceFormat },
      { $:'.ps', field:'ps', formatter:Template.priceFormat },
      { $:'.div_yield', field:'divYield', formatter:Template.priceFormat },
      { $:'.roe', field:'roe', formatter:Template.priceFormat }
    ],
    index: [
      { $:'.name', field:'name' },
      { $:'.last_trade', field:'lastTrade', formatter:Template.priceFormat },
      { $:'.timestamp .value', field:'timestamp', formatter:Template.postfix(Template.timestamp, ' ' + mapper.config.marketHours.timezone) },
      
      { $:'.change', field:'changeDir', formatter:Template.makeRedOrGreen },
      { $:'.change .amount', field:'change', formatter:Template.changeFormat },
      { $:'.change .percent', field:'changePct', formatter:Template.postfix(Template.changeFormat, '%') },
      
      { $:'.previous', field:'previous', formatter:Template.priceFormat },
      { $:'.volume', field:'volume', formatter:Template.commaFormat },
      { $:'.market_cap', field:'marketCap', formatter:Template.postfix(Template.commaFormat, 'Cr') }// Blufin Specific. Should be Template.metricFormat
    ]
  };
  
  function Details($details, opts) {
    _.extend(this, Backbone.Events);
    var _this = this,
    
        model = null,
        series_type = 'intraday',
    
        template = new mapper.Template(Details.defaultBindings),
        // compare = new mapper.Compare($('.compare', $details)),
        graph = new mapper.Graph($('.graph', $details), $('.left', $details).width() + 20, opts),
        graphRange = new mapper.SelectorButtons($('.graph .ui .ranges'), function(id) { _this.trigger('select_range', id); }),
        
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
      else if(_model) this.trigger('open');
      
      model = _model;
      if(!model) {
        this.close();
        return;
      }
      $details.removeClass('disabled');
      
      if(model) model.on('change', updateQuote);
      updateQuote();
      
      if(news) {
        news.setPending(true);
        model.acquireNews(function(data) { news.render(data); });// News feed
      }
      
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
    };
    
    this.updateGraph = function() {
      graph.setPending(true);
      Interval.callOnce(function() {
          model && model.acquireTimeSeries(series_type, function(series) { graph.render(series); });// Price+Volume graph
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
        graph.setPending(true);
        model.acquireTimeSeries(series_type, function(series) { graph.render(series); });// Price+Volume graph
      }
      
      template.applyBindings(model.get('type'), $details, model);
    }
  }
})();