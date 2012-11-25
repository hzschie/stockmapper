(function() {
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
    var ticker = mapper.NewsTicker($('.latest_news')),
        composite = mapper.groups.get('^ETFCOMP');
        
    composite.on('change:active', function(group) {
      var syms = $.map(group.get('active'), function(model){ return model.get('sym'); }),
          news = [],
          numDone = 0,
          numExpected = 0,
          step = 4;
      for(var i = 0; i < syms.length; i += step) {
        numExpected++;
        $.getJSON(
          '/news/' + syms.slice(i, i+step).join(),
          function(data) {
            news = news.concat(data);
            numDone++;
            if(numDone == numExpected) {
              news.sort(function(a,b) { return (a.t < b.t) - (a.t > b.t); });
              ticker.setHeadlines(news);
            }
          }
        );
      }
    });
    
    surface = mapper.Surface.init();
    surface.onUpdateView = function(force, viewState) {
      if(viewState.hasChanged('searchStock') || viewState.hasChanged('currentStock') || force) {
        var stock = viewState.get('searchStock') || viewState.get('currentStock') || null;
        for(var key in picksMaps) {
          $.each(picksMaps[key], function(i, map) {
            map.search(stock);
          });
        }
      }
    };
    return surface;
  };
  
  mapper.config.getGroupsView = function(groups, $groups, $title) {
    var $panel = $('.wrapper > .panel'),
        $window = $(window);
    $window.scroll(function() {
      var scrollTop = $window.scrollTop();
      if(scrollTop > 160 && !$panel.hasClass('collapsed')) {
        $panel
          .addClass('collapsed')
          .css({ 'margin-top':0 });
      }
      else if(scrollTop < 160) {
        $panel
          .removeClass('collapsed')
          .css({ 'margin-top': Math.min(0, -scrollTop) });
      }
    });
        
    
    var allEtfs = groups.get('all_etfs'),
        composite = groups.get('^ETFCOMP'),
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
        },
        
        template = new mapper.Template(bindings),
        
        micrograph = new mapper.Micrograph($('.micro.graph', $groups));
        
    mapper.GroupBehaviors.pickMembers(allEtfs, 4);
    mapper.GroupBehaviors.pickMembers(composite, 10);

    allEtfs.on('change', updateGroup);
    composite.on('change', updateGroup);
    updateGroup(allEtfs, true);
    updateGroup(composite, true);
    
    composite.acquireTimeSeries('intraday', function(series) { micrograph.setTimeSeries(series); });
    
    $groups.children().click(function() {
      var idAttr = $(this).attr('id');
      instance.trigger('select_group', idAttr == composite.get('domName') ? composite : groups.get(idAttr));
    });
    
    function updateGroup(group, force) {
      var $group = $('#' + group.get('domName'));
      if(group.hasChanged('upsAndDowns')) {
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
        
        if(selected == composite) {
          $title.text(group.get('name').toUpperCase());
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
    return instance;
  };
})();