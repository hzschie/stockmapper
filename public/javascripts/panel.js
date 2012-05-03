(function() {
  function Panel($panel, groups) {
    var order = _.map([
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
    
    _.extend(this, Backbone.Events);
    var _this = this;
    
    // If groups is already populated (may be partially), we handle those groups now
    groups.forEach(function(group) {
      addGroup(group);
      updateGroup(group, true);
    });
    // Subscribe to subsequent adding of groups
    groups.bind('add', addGroup);

    function addGroup(group) {
      var type = group.get('type'),
          nickname = group.get('nickname'),
          reference = type + ':' + nickname,
          record = _.find(order, function(entry) {
            return entry.reference == reference;
          }),
          index = _.indexOf(order, record);
      
      if(!record) { return; }

      var actualIndex = 0;
      for(var i = 0; i < index; i++) {
        if(order[i].isFilled) actualIndex++;
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
    }
    
    function updateGroup(group, force) {
      var counts = group.get('upsAndDowns');
      group.get('$counts').text('+' + counts[0] + '-' + counts[1]);
      group.get('$tag').css({ 
        backgroundColor: 'rgb(' + mapper.fractionChangeToHex(counts[0]/counts[1] - 1) + ')'
      });
    }
  }
  
  mapper.Panel = Panel;
})();