(function() {
  function Panel($panel, groups) {
    _.extend(this, Backbone.Events);
    var _this = this,
        selectedGroup = null,
        $selectedSort = null;

    // If tags order is explicitly defined in config, use it. Otherwise, assume all groups 
    // should be added, and create tagsOrder based on that.
    var tagsOrder = _.map(
      mapper.config.groupsTagOrder || groups.models,
      function(refOrGroup) {
        var reference = typeof(refOrGroup) == 'string' ? 
          refOrGroup : (refOrGroup.get('type') + ':' + refOrGroup.get('nickname'));
        return { reference:reference, isFilled:false };
      }
    );
    
    var buttonsOrder = [
      { id:'sym', label:'Ticker Symbol' },
      { id:'chg', label:'Percent Chng' },
      { id:'vol', label:'Volume' },
      { id:'cap', label:'Market Cap' }
    ];
    
    buttonsOrder.forEach(function(btnObj) {
      btnObj.$btn = $(document.createElement('div')).addClass('sort').addClass('button').html([
        '<div class="type">SORT BY:</div>', 
        '<label>', btnObj.label, '</label>'
      ].join('')).appendTo($panel).click(function() {
        _this.trigger('select_sort', btnObj.id);
      });
    });
    
    // If groups is already populated (may be partially), we handle those groups now
    groups.forEach(addGroup);
    // Subscribe to subsequent adding of groups
    groups.on('add', addGroup);
    
    this.setSelectedGroup = function(group) {
      if(selectedGroup) {
        selectedGroup.get('$tag').removeClass('selected');
      }
      selectedGroup = group;
      if(selectedGroup) {
        selectedGroup.get('$tag').addClass('selected');
      }
    };
    
    this.setSelectedSort = function(sort) {
      if($selectedSort) {
        $selectedSort.removeClass('selected');
      }
      var sortObj = _.find(buttonsOrder, function(obj) { return obj.id == sort; });
      $selectedSort = sortObj && sortObj.$btn;
      if($selectedSort) {
        $selectedSort.addClass('selected');
      }
    };

    function addGroup(group) {
      var type = group.get('type'),
          nickname = group.get('nickname'),
          label = group.get('label'),
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
      
      var $tag = $(document.createElement('div')).addClass('group').addClass('button').html([
        '<div class="counts"></div>',
        '<div class="type">', type.toUpperCase(), '</div>', 
        '<label>', label, '</label>'
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
      var counts = group.get('upsAndDowns'),
          fraction = !counts[1] ? (counts[0] && 1) : (counts[0]/counts[1] - 1);
      group.get('$counts').text('+' + counts[0] + '-' + counts[1]);
      group.get('$tag').css({ 
        backgroundColor: 'rgb(' + mapper.fractionToGreenRedHex(fraction) + ')'
      });
    }
  }
  
  mapper.Panel = Panel;
})();