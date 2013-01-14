(function() {
  /* Mapping of Array positions to attributes that get applied to instances of Stock on data updates */
  mapper.config.getStockUpdateFields = function() { return [
    null,
    null, 
    { name:'lastTrade' },
    { name:'timestamp' },
    null,
    { name:'change' },
    { name:'previous' },
    { name:'open' },
    { name:'high' },
    { name:'low' },
    { name:'volume' },
    { name:'changePct' },
    { name:'marketCap' },
    { name:'avgVolume' },

    { name:'pe' },
    { name:'pb' },
    { name:'ps' },
    { name:'divYield' },
    { name:'roe' }
  ]; };

  /* Mapping of Array positions to attributes that get applied to instances of StockGroup on data updates */
  mapper.config.getGroupUpdateFields = function() { return [
    null,
    null, 
    { name:'lastTrade' },
    { name:'timestamp' },
    { name:'previous' },
    { name:'change' },
    { name:'volume' },
    { name:'changePct' },
    { name:'marketCap' }
  ]; };

  var surface,
      coloringSelector,
      coloringPeriod;
  mapper.config.init = function() {
    mapper.stocks.acquireDataset('low_high', { idPropName: 'cid' });
    surface = mapper.Surface.init();
    
    // Enable coloring by historical change
    surface.viewState.get('trackedParams').push('change_from');
    coloringSelector = new mapper.DropdownSelector($('.coloring'), function(id) { surface.viewState.setState({ change_from:id }); });
    coloringSelector.periodProps = {
      p10yr: { prop:'typ', label:"from 10 years ago" },
      p52wk: { prop:'ftwp', label:"from 52 weeks ago" },
      pYTD: { prop:'ytdp', label:"for this year" },
      p1mo: { prop:'mp', label:"from 1 month ago" },
      p1wk: { prop:'wp', label:"from 1 week ago" }
    };
    // Prepare inspector to show historical change info
    $('.inspector .content.stock').append($([
      '<div class="historical">',
        '<div class="change_from"></div>',
        '<div class="historical_change"></div>',
      '</div>'
    ].join('')));
    
    surface.onUpdateView = function(force, viewState) {
      if(viewState.hasChanged('change_from') || force) {
        var changeFrom = viewState.get('change_from') || 'today';
        coloringSelector.setCurrent(changeFrom);// Update the selector

        coloringPeriod = coloringSelector.periodProps[changeFrom];
        var periodProp = coloringPeriod && coloringPeriod.prop,
            changeProp = changeFrom == 'today' ? 'changePct' : 'historicalChangePct';

        var fn = function(stock) {
          return !periodProp ? null : 100 * (stock.get('lastTrade') / stock.get(periodProp) - 1);
        };
        mapper.stocks.each(function(s) {
          s.setComputedProp('historicalChangePct', fn);
        });
      
        // Update views to use selectoed property
        surface.map.setChangeProp(changeProp);
        surface.chart.setChangeProp(changeProp);
        
        // Update sorting
        mapper.sortFunctions.chg.setAttribute(changeProp);
        viewState.get('currentGroup').resortMembers(false);
        
        // Update title
        $('.map .title .sub').text(coloringPeriod ? '% change ' + coloringPeriod.label : '');
      }
    };

    return surface;
  };
  
  mapper.config.getInspectorBindings = function(bindings) {
    var Template = mapper.Template;
    _.each(bindings.stock, function(binding) {
      if(binding.$ == '.market_cap') {
        binding.field = 'marketCap';
        binding.formatter = Template.postfix(Template.commaFormat, 'Cr');
      }
      if(binding.$ == '.sym') {
        binding.formatter = function(val, $field) {
          if(val.length >= 10) return '<span class="tight">' + val + '</span>';
          return val;
        };
      }
    });
    return {
      stock: (bindings.stock || []).concat([
        { $:'.change_from', formatter:function() { return '% Change ' + (coloringPeriod && coloringPeriod.label) + ':'; } },
        { $:'.historical_change', field:'historicalChangePct', formatter:Template.pctChangeFormatter() },
        { $:'.historical_change', field:'historicalChangePct', formatter:function(val, $val) { Template.makeRedOrGreen(val < 0 ? -1 : val > 0 ? 1 : 0, $val); }  },
        { $:'.historical', field:'historicalChangePct', formatter:function(val, $container) { val == null ? $container.hide() : $container.show(); } },
        { $:'.stock dl', field:'historicalChangePct', formatter:function(val, $container) { val == null ? $container.show() : $container.hide(); } }
      ]),
      index: bindings.group.concat([
        { $:'.category', field:'category', formatter:function(val) { return 'Stocks by ' + mapper.capitalize(val); } },
        { $:'.label', field:'name' },
        { $:'.last_trade', field:'lastTrade', formatter:Template.commaFormat },
        { $:'.change', field:'changeDir', formatter:Template.makeRedOrGreen },
        { $:'.change .amount', field:'change', formatter:Template.changeFormat },
        { $:'.change .percent', field:'changePct', formatter:Template.NaIfNaN(Template.postfix(Template.changeFormat, '%')) },
        { $:'.previous', field:'previous', formatter:Template.commaFormat },
        { $:'.volume', field:'volume', formatter:Template.commaFormat },
        { $:'.market_cap', field:'marketCap', formatter:Template.postfix(Template.commaFormat, 'Cr') }
      ])
    };
  };

  mapper.config.getDetailsBindings = function(bindings) {
    var Template = mapper.Template,
        crMarketCap = Template.postfix(Template.commaFormat, 'Cr');
    _.each(bindings.stock, function(binding) {
      if(binding.field == 'marketCap') {
        binding.formatter = crMarketCap;
      }
    });
  
    return {
      stock: bindings.stock.concat([
        { $:'.pe', field:'pe', formatter:Template.priceFormat },
        { $:'.pb', field:'pb', formatter:Template.priceFormat },
        { $:'.ps', field:'ps', formatter:Template.priceFormat },
        { $:'.div_yield', field:'divYield', formatter:Template.priceFormat },
        { $:'.roe', field:'roe', formatter:Template.priceFormat }
      ]),
      index: bindings.index.concat([
        { $:'.volume', field:'volume', formatter:Template.commaFormat },
        { $:'.market_cap', field:'marketCap', formatter:crMarketCap }
      ])
    };
  };


  mapper.config.getMapTagHtml = function(model) {
    var sym = model.get('sym');
    if(sym.length >= 11 &&
      (sym == "WINDSOR MACH" || sym == "VARDHMNPOLY" || sym == "MUNJALSHOWA" || sym == "INDORAMASYN")) {
        return '<span class="tight">' + sym + '</span>';
    }
    return sym;
  };

  mapper.config.getGroupTagHtml = function(group, $container) {
    if(group.get('type') == 'index') return [
        '<div class="val_right">',
          '<div class="value"></div>',
          '<div class="changes">',
            '<span class="change"></span> ',
            '<span>(<span class="change_pct"></span>)</span>',
          '</div>',
        '</div>',
        '<label>', group.get('label'), '</label>'
      ].join('');
    else return [
        '<div class="val_right counts"></div>',
        '<label>', group.get('label'), '</label>'
      ].join('');
  };

  mapper.config.getGroupBindings = function(bindings) {
    var Template = mapper.Template;
    bindings.index.push({ $:'.change_pct', field:'changePct', formatter:Template.pctChangeFormatter() });
    return bindings;
  };
  /*
  mapper.config.getGroupBindings = function(bindings) {
    return {
      index: [
        { $:'.value', field:'lastTrade', formatter:Template.blankIfNull(Template.commaFormat) },
        // { $:'.change', field:'changePct', formatter:Template.blankIfNull(Template.postfix(Template.changeFormat, '%')) },
        { $:'.change', field:'change', formatter:Template.blankIfNull(Template.changeFormat) },
        { $:null, field:'changePct', formatter:function(changePct, $container) {
          if(changePct == null) return;
          $container.css({ 
            backgroundColor: mapper.changePctToHex(changePct, 5)
          });
          return null;
        }}
      ]
    };
  };*/
})();