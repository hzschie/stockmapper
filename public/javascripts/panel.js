(function() {
  function Panel($panel, groups) {
    _.extend(this, Backbone.Events);
    var _this = this;

    var tagsOrder = _.map([
      'sector:Materials',
      'sector:Goods',
      'sector:Services',
      'sector:Financials',
      'sector:Health Care',
      'sector:Industrials',
      'sector:Oil & Gas',
      'sector:Technology',
      'sector:Telecom',
      'sector:Utilities',
      'index:Dow Jones',
      'index:S&P 500',
      'region:United States',
      'region:Asia/Pacific',
      'region:Canada',
      'region:Europe',
      'region:Latin America',
      'region:MidEast/Africa'
    ], function(reference) { 
      return { reference:reference, isFilled:false };
    });
    
    var buttonsOrder = [
      { id:'sym', label:'Ticker Symbol' },
      { id:'chg', label:'Percent Chng' },
      { id:'vol', label:'Volume' },
      { id:'cap', label:'Market Cap' }
    ];
    
    buttonsOrder.forEach(function(btnObj) {
    });
    
    // If groups is already populated (may be partially), we handle those groups now
    groups.forEach(addGroup);
    // Subscribe to subsequent adding of groups
    groups.on('add', addGroup);

    function addGroup(group) {
      var type = group.get('type'),
          nickname = group.get('nickname'),
          urlName = group.get('urlName'),
          reference = type + ':' + nickname,
          record = _.find(tagsOrder, function(entry) {
            return entry.reference == reference;
          }),
          index = _.indexOf(tagsOrder, record);
      
      if(!record) return;

      for(var i = 0, actualIndex = 0; i < index; i++) { 
        if(tagsOrder[i].isFilled) actualIndex++;
      }
      
      var $tag = $(document.createElement('div')).addClass('group').html([
        '<div class="counts"></div>',
        '<div class="type">', type.toUpperCase(), '</div>', 
        '<label>', nickname, '</label>'
      ].join(''));
      
      // Add panel in the right place
      if(actualIndex == 0) $panel.prepend($tag);
      else $panel.children().eq(actualIndex - 1).after($tag);
      
      $tag.bind('click', function() {
        _this.trigger('select_group', group);
      });
            
      record.isFilled = true;
      group.set({
        $tag: $tag,
        $counts: $tag.find('.counts')
      }, { silent:true });
      group.on('change', updateGroup);
      
      updateGroup(group, true);
    }
    
    function updateGroup(group, force) {
      var counts = group.get('upsAndDowns');
      group.get('$counts').text('+' + counts[0] + '-' + counts[1]);
      group.get('$tag').css({ 
        backgroundColor: 'rgb(' + mapper.fractionChangeToHex((counts[0]/counts[1] - 1) || 1) + ')'
        // || 1 above is in case counts[1] (ie "downs") is zero, which produces NaN
      });
    }
  }
  
  mapper.Panel = Panel;
})();