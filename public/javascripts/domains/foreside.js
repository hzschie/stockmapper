(function() {
  
  var navBar;
  var pager;
  var $closeWebPage;
  $(document).ready(function() {
    var NavBar = Backbone.View.extend({
      events: {
        "click a": "link_clicked"
      },
      initialize: function() {
        var $haveSubmenus = this.$('.has-submenu');
        $haveSubmenus.hover(
          function() { $(this).find('.submenu').show(); },
          function() { $(this).find('.submenu').hide(); }
        );
      },
      link_clicked: function(e) {
        if(!e.metaKey) {
          e.preventDefault();
          var href = $(e.target).attr('href') || $(e.target).parent().attr('href');
          this.trigger('link_clicked', href);
        }
      }
    });
    var Pager = Backbone.View.extend({
      initialize: function() {
        this.$current = null;
      },
      setPage: function(id) {
        if(this.$current) {
          if(this.$current.data('url') == id) { return; }
          this.$current.slideUp();
        }
        this.$current = this.$('.page[data-url="' + id + '"]');
        this.$current.slideDown();
        $(window).scrollTop(0);
      }
    });
    navBar = new NavBar({ el: '#header' });
    pager = new Pager({ el: '.website > .inner' });
    $('[data-url="' + window.location.pathname + '"]').show();
    
    $closeWebPage = $('.website .close-btn')
      .on('click', function() {
        pager.setPage('/');
        surface.viewState.setState({}, '/');
      });
  });


  
  /* Mapping of Array positions to attributes that get applied to instances of Stock on data updates */
  mapper.config.getStockUpdateFields = function() {
    var numeric = mapper.MapperModel.numeric,
        parseMCap = mapper.MapperModel.parseMarketCapString;
    return [
      null,
      null, 
      { name:'lastTrade', formatter:numeric },
      { name:'timestamp', formatter:numeric },
      null,
      { name:'change', formatter:numeric },
      { name:'previous', formatter:numeric },
      { name:'open', formatter:numeric },
      { name:'high', formatter:numeric },
      { name:'low', formatter:numeric },
      { name:'volume', formatter:numeric },
      { name:'changePct', formatter:parseFloat },
      { name:'marketCapString', formatter:function(val, field, hash) { hash.marketCap = parseMCap(val); return val; } },
      { name:'avgVolume', formatter:numeric },
      { name:'52wkLow', formatter:numeric },
      { name:'52wkHigh', formatter:numeric },
      
      // Derived property
      { name:'ftwhl', formatter:function(val, field, hash) { 
        val = {
          l:hash['52wkLow'],
          h:hash['52wkHigh']
        };
        delete hash['52wkLow'];
        delete hash['52wkHigh'];
        return val;
      } }
    ];
  };

  /* Mapping of Array positions to attributes that get applied to instances of StockGroup on data updates */
  mapper.config.getGroupUpdateFields = function() {
    return mapper.config.getStockUpdateFields();
  };
  
  var surface,// The controller of the whole app, which we hang onto for extending default behaviors
      picks = ['gainers', 'losers', 'active'],
      picksMaps = {};// Mapping of pick – per group – to map instances
  
  mapper.config.init = function() {
    navBar.on('link_clicked', function(href) {
      pager.setPage(href);
      var params = {};
      if(href == "/products/etfcomposite") {
        params.filter = "etf+composite";
      }
      surface.viewState.setState(params, href);
    });
    
    surface = mapper.Surface.init();
    
    var portfolio = window.portfolio = new mapper.Portfolio({
      el: '.portfolio.page',
      map: surface.map
    });
    
    // Enable coloring by historical change
    surface.viewState.get('trackedParams').push('change_from');
    coloringSelector = new mapper.DropdownSelector($('.coloring'), function(id) { surface.viewState.setState({ change_from:id }); });
    coloringSelector.periodProps = {
      p10yr: { prop:'typ', f:1, label:"from 10 years ago" },
      p52wk: { prop:'ftwp', f:1, label:"from 52 weeks ago" },
      pYTD: { prop:'ytdp', f:.6, label:"for this year" },
      p1mo: { prop:'mp', f:.3, label:"from 1 month ago" },
      p1wk: { prop:'wp', f:.1, label:"from 1 week ago" }
    };
    // Prepare inspector to show historical change info
    $('.inspector .content.stock').append($([
      '<div class="historical">',
        '<div class="change_from"></div>',
        '<div class="historical_change"></div>',
      '</div>'
    ].join('')));

    surface.onUpdateView = function(force, viewState) {
      pager.setPage(viewState.urlBase);
      $closeWebPage.css('display', viewState.urlBase && viewState.urlBase.length > 1 ? 'block' : 'none');
      if(viewState.hasChanged('searchStock') || viewState.hasChanged('currentStock') || force) {
        var stock = viewState.get('searchStock') || viewState.get('currentStock') || null;
        for(var key in picksMaps) {
          $.each(picksMaps[key], function(i, map) {
            map.search(stock);
          });
        }
      }
      
      // Update based on coloring selection
      if(viewState.hasChanged('change_from') || force) {
        var changeFrom = viewState.get('change_from') || 'today';
        coloringSelector.setCurrent(changeFrom);// Update the selector

        coloringPeriod = coloringSelector.periodProps[changeFrom];
        var periodProp = coloringPeriod && coloringPeriod.prop,
            changeProp = changeFrom == 'today' ? 'changePct' : 'historicalChangePct';

        var fn = function(stock) {
          var ftwhl = stock.get('ftwhl');
          if(!periodProp) return null;
          if(!ftwhl) { return NaN; }
          var currentPrice = stock.get('lastTrade');
          var low = currentPrice + (ftwhl.l - currentPrice) * coloringPeriod.f;
          var high = currentPrice + (ftwhl.h - currentPrice) * coloringPeriod.f;
          var historicalPrice = (low + high) / 2;
          return !periodProp ? null : 100 * (currentPrice / historicalPrice - 1);
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
    return {
      stock: (bindings.stock || []).concat([
        { $:'.change_from', formatter:function() { return '% Change ' + (coloringPeriod && coloringPeriod.label) + ':'; } },
        { $:'.historical_change', field:'historicalChangePct', formatter:Template.pctChangeFormatter() },
        { $:'.historical_change', field:'historicalChangePct', formatter:function(val, $val) { Template.makeRedOrGreen(val < 0 ? -1 : val > 0 ? 1 : 0, $val); }  },
        { $:'.historical', field:'historicalChangePct', formatter:function(val, $container) { val == null ? $container.hide() : $container.show(); } },
        { $:'.stock dl', field:'historicalChangePct', formatter:function(val, $container) { val == null ? $container.show() : $container.hide(); } }
      ])
    };
  };
  
  mapper.config.getGroupsView = function(groups, $groups, $title) {
    var allEtfs = groups.get('all_etfs'),
        composite = groups.get('^ETFCOMP'),
        etf50 = groups.get('^ETFF'),
        selected = null,// the selected group
        Template = mapper.Template,
        timezone = mapper.config.marketHours.timezone,
        bindings = {
          all_etfs: [
            { $:'.num_up', field:'upsAndDowns', formatter:function(counts, $field, group) { return countWithPct(counts[0], group.get('members').length); } },
            { $:'.num_down', field:'upsAndDowns', formatter:function(counts, $field, group) { return countWithPct(counts[1], group.get('members').length); } },
            { $:'.volume_up', field:'volumeUp', formatter:function(volume, $field, group) { return countWithPct(volume, group.get('volumeTotal')); } },
            { $:'.volume_down', field:'volumeDown', formatter:function(volume, $field, group) { return countWithPct(volume, group.get('volumeTotal')); } }
          ],
          '^ETFCOMP': [
            { $:'.last_trade', field:'lastTrade', formatter:Template.priceFormat },
            { $:'.timestamp .value', field:'timestamp', formatter:Template.postfix(Template.blankIfNull(Template.timestamp), ' ' + timezone) },

            { $:'.change', field:'changeDir', formatter:Template.makeRedOrGreen },
            { $:'.change .amount', field:'change', formatter:Template.changeFormat },
            { $:'.change .percent', field:'changePct', formatter:Template.postfix(Template.changeFormat, '%') },

            { $:'.previous', field:'previous', formatter:Template.priceFormat },
            { $:'.open', field:'open', formatter:Template.priceFormat },
            { $:'.high', field:'high', formatter:Template.priceFormat },
            { $:'.low', field:'low', formatter:Template.priceFormat }
          ]
          // product: [
          
        },
        
        template = new mapper.Template(bindings),
        
        compositeMicrograph = new mapper.Micrograph($('#etf_composite .micro.graph', $groups));
        etf50Micrograph = new mapper.Micrograph($('#etf_50 .micro.graph', $groups));
        
    mapper.GroupBehaviors.pickMembers(allEtfs, 4);
    mapper.GroupBehaviors.pickMembers(composite, 10);

    allEtfs.on('change', updateGroup);
    composite.on('change', updateGroup);
    etf50.on('change', updateProduct);
    updateGroup(allEtfs, true);
    updateGroup(composite, true);
    updateProduct(etf50, true);
    
    composite.acquireTimeSeries('intraday', function(series) { compositeMicrograph.setTimeSeries(series); });
    etf50.acquireTimeSeries('intraday', function(series) { etf50Micrograph.setTimeSeries(series); });
    
    $groups.find('.group').click(function() {
      var idAttr = $(this).attr('id');
      var group = groups.where({ domName: idAttr })[0];
      instance.trigger('select_group', group || groups.get(idAttr));
    });
    
    function updateGroup(group, force) {
      var $group = $('#' + group.get('domName'));
      if(group.hasChanged('upsAndDowns') || force) {
        template.applyBindings(group.id, $group, group);
      }

      $.each(picks, function(i, pick) {
        if(group.hasChanged(pick) || (force && group.has(pick))) {
          var map = picksMaps[i];
          
          var map = picksMaps[group.id];
          if(!map) map = picksMaps[group.id] = [];
          
          map = map[i];
          if(!map) {
            map = picksMaps[group.id][i] = mapper.MapLite($group.find('.' + pick + ' ul').click(function(e) { e.stopPropagation(); }));
            
            map.on('select_tag', function(model, $tag) {
              mapper.surface.query(model);
            });
            map.on('inspect_tag', function(model, $tag) {
              mapper.surface.inspectTag(model, $tag);
            });
          }
          
          map.setModels(group.get(pick));
        }
      });
    }
    
    function updateProduct(product, force) {
      var $product = $('#' + product.get('domName'));
      template.applyBindings('^ETFCOMP', $product, product);
    }
    
    function countWithPct(count, total) {
      var pct = Math.round(100 * count / total);
      return mapper.Template.commaFormat(count) + ' (' + pct + '%)';
    }
        
    var instance = {
      setSelected: function(group) {
        if(selected) {
          $('#' + selected.get('domName')).removeClass('selected');
          $title.removeClass(selected.get('domName'));
        }
        selected = group;
        $('#' + selected.get('domName')).addClass('selected');
        
        if(selected != allEtfs) {
          $title.text('');
        }
        else {
          $title.text(group.get('name'));
        }
        $title.addClass(selected.get('domName'));
      },
      search: function() {},
      resize: function() {
        var w = $groups.width(),
            hasNarrow = $groups.hasClass('narrow');
        if(w <= 990 && !hasNarrow) {
          $groups.addClass('narrow');
        }
        else if(w >= 990 && hasNarrow) $groups.removeClass('narrow');
      }
    };
    _.extend(instance, Backbone.Events);
    instance.resize();
    return instance;
  };
})();