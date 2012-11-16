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
  
  mapper.config.getGroupsView = function(groups, $groups, $title) {
    var $allEtfs = $('#all_etfs'),
        allEtfs = groups.get('all_etfs'),
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

    allEtfs.on('change', updateGroup);
    
    var picks = ['gainers', 'losers', 'active'],
        picksMaps = [];
    function updateGroup(group) {
      if(group.hasChanged('upsAndDowns')) {
        template.applyBindings(group.id, $allEtfs, allEtfs);
      }
      
      $.each(picks, function(i, pick) {
        if(group.hasChanged(pick)) {
          var map = picksMaps[i];
          if(!map) map = picksMaps[i] = mapper.MapLite($allEtfs.find('.' + pick + ' ul'));
          map.setModels(group.get(pick));
        }
      });
    }
    
    function countWithPct(count, total) {
      var pct = Math.round(100 * count / total);
      return mapper.Template.commaFormat(count) + ' (' + pct + '%)';
    }
        
    var instance = {
      setSelected: function() {},
      search: function() {},
      resize: function() {}
    };
    _.extend(instance, Backbone.Events);
    return instance;
  };
})();