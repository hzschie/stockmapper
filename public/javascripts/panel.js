(function() {
  var T = 0, R = 1, B = 2, L = 3;
  Panel.defaultBindings = {
    group: [
      { $:'.counts', field:'upsAndDowns', formatter:function(counts) { return '+' + counts[0] + '-' + counts[1]; } },
      { $:null, field:'upsAndDowns', formatter:function(counts, $container) {
        var fraction = !counts[1] ? (counts[0] && 1) : (counts[0]/counts[1] - 1);
        $container.css({ 
          backgroundColor: 'rgb(' + mapper.fractionToGreenRedHex(fraction) + ')'
        });
        return null;
      }}
    ]
  };
  function Panel($panel, groups) {
    _.extend(this, Backbone.Events);
    var _this = this,
        grid = null,
        selectedGroup = null,
        $selectedSort = null,
        $groups = $panel.find('.groups'),
        $sorts = $panel.find('.sorts'),
        $title = $panel.find('.title'),
        //padding = _.map($panel.css('padding').split(' '), function(p) { return parseInt(p, 10); }),
        padding = [10, 9, 12, 9],
        margin,
        getGroupHtml = mapper.config.getPanelGroupHtml || function(group) {
          return [
            '<div class="type">', group.get('type').toUpperCase(), '</div>', 
            '<label>', group.get('label'), '</label>'
          ].join('');
        },
        template = new mapper.Template(
          $.extend(Panel.defaultBindings, mapper.config.getGroupBindings && mapper.config.getGroupBindings(Panel.defaultBindings))
        );
    while(padding.length < 4) { padding.push(padding[0]); }
    
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
      ].join('')).appendTo($sorts).click(function() {
        _this.trigger('select_sort', btnObj.id);
      });
    });
    
    // If groups is already populated (may be partially), we handle those groups now
    groups.forEach(addGroup);
    // Subscribe to subsequent adding of groups
    groups.on('add', addGroup);
    
    this.height = function() {
      // var h = grid.bounds().h + 23;
      // $panel.css({ height: h });
      return $panel.outerHeight();
    };
    
    this.setSelectedGroup = function(group) {
      if(selectedGroup) {
        selectedGroup.get('$tag').removeClass('selected');
      }
      selectedGroup = group;
      if(selectedGroup) {
        selectedGroup.get('$tag').addClass('selected');
        $title.text(group.get('name'));
      }
    };
    
    this.search = function(stock) {
      $('.search_result', $groups).removeClass('search_result');
      if(!stock) {
        $groups.removeClass('dimmed');
      }
      else {
        $groups.addClass('dimmed');
        _.forEach(stock.get('groups'), function(group) {
          group.get('$tag').addClass('search_result');
        });
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
      
      var $tag = $(document.createElement('div')).addClass('group').addClass('button');
      $tag.html(getGroupHtml(group, $tag));
      
      // Add panel in the right place
      if(actualIndex == 0) $groups.prepend($tag);
      else $groups.children().eq(actualIndex - 1).after($tag);
      
      if(!grid) {
        //margin = _.map($tag.css('margin').split(' '), function(m) { return parseInt(m, 10); });
        margin = [1,2,2,1];

        grid = new mapper.Grid(
          tagsOrder.length, $panel.width(), 
          $tag.outerWidth() + margin[L] + margin[R], 
          $tag.outerHeight() + margin[T] + margin[B],
          makeCells);
        $groups.css({
          width: grid.bounds().w,
          height: grid.bounds().h
        });
        // $sorts.css({
        //   // left: grid.x(grid.cols - buttonsOrder.length) + padding[L]
        //   right: $panel.width() - grid.x(grid.cols) + padding[R] - margin[L]
        // });
      }
      $tag.css({
        left: grid.xi(index),
        top: grid.yi(index)
      });
      
      $tag.bind('click', function() {
        _this.trigger('select_group', group);
      });
      $tag.hover(
        function() {
          _this.trigger('inspect_group', group, $tag);
        },
        function() {
          _this.trigger('inspect_group', null, null);
        }
      );
            
      record.isFilled = true;
      group.set({
        $tag: $tag
      }, { silent:true });
      group.on('change', updateGroup);
      
      updateGroup(group);
    }
    
    function updateGroup(group) {
      var type = (mapper.config.getGroupType && mapper.config.getGroupType(group.get('type'), group)) || group.get('type');
      template.applyBindings(type, group.get('$tag'), group);
    }
    
    function makeCells(n, c, r) {
      var centered = false,
          rotated = true,
          cells = [],
          d = c * r - n,
          _c = 0, _r = 0;
      var adj = Math.min(1, centered ? Math.floor(d/2) : 0);
      for(var i = 0; i < n; i++) {
        cells[i] = [_c, _r];
        if(rotated) {
          _r++;
          if(_r >= r - adj) {
            _r = 0;
            _c++;
            if(centered) {
              adj = _c < d/2 || _c >= c - d/2 ? 1 : 0;
            }
            else {
              adj = _c >= c - d ? 1 : 0;
            }
          }
        }
        else {
          _c++;
          if(_c == c) {
            _c = 0;
            _r++;
          }
        }
      }
      return cells;
    }    
    function XmakeCells(n, c, r) {
      var cells = [],
          _c = 0, _r = 0;
      for(var i = 0; i < n; i++) {
        cells[i] = [_c, _r, tagsOrder[i].reference.match(/^.*\:/)[0]];
        _r++;
        if(_r >= r || 
          ((i < n - 1) && cells[i][2] != tagsOrder[i+1].reference.match(/^.*\:/)[0])) {
          _r = 0;
          _c++;
        }
      }
      return cells;
    }
    
    function XXmakeCells(n, c, r) {
      var cells = [],
          _c = 0, _r = 0,
          dir = 1;
      for(var i = 0; i < n; i++) {
        cells[i] = [_c, _r];
        _r += dir;
        if(_r >= r || _r < 0) {
          dir *= -1;
          _r += dir;
          _c++;
        }
      }
      return cells;
    }
  }
  
  mapper.Panel = Panel;
})();