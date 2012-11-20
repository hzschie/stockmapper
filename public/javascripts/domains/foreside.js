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
      { name:'avgVolume', formatter:numeric }
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
    surface = mapper.Surface.init();
    var ticker = mapper.NewsTicker($('.latest_news'));
    mapper.stocks.at(10).acquireNews(function(news) {
      ticker.setHeadlines(news);
    });
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
    var allEtfs = groups.get('all_etfs'),
        composite = groups.get('etf_composite'),
        selected = null,// the selected group
        bindings = {
          all_etfs: [
            { $:'.num_up', field:'upsAndDowns', formatter:function(counts, $field, group) { return countWithPct(counts[0], group.get('members').length); } },
            { $:'.num_down', field:'upsAndDowns', formatter:function(counts, $field, group) { return countWithPct(counts[1], group.get('members').length); } },
            { $:'.volume_up', field:'volumeUp', formatter:function(volume, $field, group) { return countWithPct(volume, group.get('volumeTotal')); } },
            { $:'.volume_down', field:'volumeDown', formatter:function(volume, $field, group) { return countWithPct(volume, group.get('volumeTotal')); } }
          ]
        },
        
        template = new mapper.Template(bindings);  
        
    mapper.GroupBehaviors.pickMembers(allEtfs, 4);
    mapper.GroupBehaviors.pickMembers(composite, 10);

    allEtfs.on('change', updateGroup);
    composite.on('change', updateGroup);
    updateGroup(allEtfs, true);
    updateGroup(composite, true);
    
    $groups.children().click(function() {
      instance.trigger('select_group', groups.get( $(this).attr('id') ));
    });
    
    function updateGroup(group, force) {
      var $group = $('#' + group.id);
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
              mapper.surface.query(model);//viewState.setState({ q: model.id, compare:null });
            });
            map.on('inspect_tag', function(model, $tag) {
              mapper.surface.inspectTag(model, $tag);//inspector.inspectTag(model, $tag);
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
          $('#' + selected.id).removeClass('selected');
          $title.removeClass(selected.id);
        }
        selected = group;
        
        $('#' + selected.id).addClass('selected');
        
        if(selected == composite) {
          $title.text(group.get('name').toUpperCase());
        }
        else {
          $title.text(group.get('name'));
        }
        $title.addClass(group.id);
      },
      search: function() {},
      resize: function() {}
    };
    _.extend(instance, Backbone.Events);
    return instance;
  };
})();