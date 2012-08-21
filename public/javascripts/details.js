(function() {
  mapper.Details = Details;
  var Template = mapper.Template;
  Details.defaultBindings = {
    stock: [
      { $:'.sym', field:'sym' },
      { $:'.name', field:'name' },
      { $:'.last_trade', field:'lastTrade', formatter:Template.priceFormat },

      { $:'.change', field:'changeDir', formatter:Template.makeRedOrGreen },
      { $:'.change .amount', field:'change', formatter:Template.changeFormat },
      { $:'.change .percent', field:'changePct', formatter:Template.postfix(Template.changeFormat, '%') },

      { $:'.open', field:'open', formatter:Template.priceFormat },
      { $:'.high', field:'high', formatter:Template.priceFormat },
      { $:'.low', field:'low', formatter:Template.priceFormat },
      
      { $:'.avg_volume', field:'avgVolume', formatter:Template.commaFormat },
      { $:'.volume', field:'volume', formatter:Template.commaFormat },
      { $:'.market_cap', field:'marketCapString' },

      { $:'.pe', field:'pe', formatter:Template.priceFormat },
      { $:'.pb', field:'pb', formatter:Template.priceFormat },
      { $:'.ps', field:'ps', formatter:Template.priceFormat },
      { $:'.div_yield', field:'divYield', formatter:Template.priceFormat },
      { $:'.roe', field:'roe', formatter:Template.priceFormat }
    ]
  };
  
  function Details($details) {
    _.extend(this, Backbone.Events);
    var _this = this,
    
        model = null,
        series_type = 'intraday',// 'daily',//
    
        template = new mapper.Template(Details.defaultBindings),
        graph = new mapper.Graph($('.graph', $details), $details.width() / 2),
        graphRange = new mapper.GraphRange($('.graph .ui .ranges'), function(id) { _this.trigger('select_range', id); }),
        news = new mapper.News($('.news', $details));
        
    $('.close', $details).click(function() { _this.trigger('click_close'); });
    
    this.query = function(_model) {
      model = _model;
      if(!model) {
        $details.css({ opacity:0 });
        return;
      }
      $details.show().css({ opacity:1 });
      
      template.applyBindings('stock', $details, model);
      
      model.acquireNews(function(data) { news.render(data); });// News feed
      this.updateGraph();
    };
    
    this.setRange = function(range) {
      graphRange.setRange(range);

      if(range == 'r1d') series_type = 'intraday';
      else if(range == 'r5d') series_type = '5day';
      else series_type = 'daily';
      
      this.updateGraph();
    };
    
    this.updateGraph = function() {
      Interval.callOnce({ 
        fn:function() {
          model.acquireTimeSeries(series_type, function(series) { graph.render(series); });// Price+Volume graph          
        },
        key:'update_graph'
      });
    };
  }
})();