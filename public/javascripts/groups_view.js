(function() {
  GroupsView.defaultBindings = {
    group: [
      { $:'.counts', field:'upsAndDowns', formatter:function(counts) { return '+' + counts[0] + '-' + counts[1]; } },
      { $:null, field:'upsAndDowns', formatter:function(counts, $container, group) {
        var fraction = !counts[1] ? (counts[0] && 1) : (counts[0]/counts[1] - 1);
        // var fraction = 2*counts[0]/(counts[0]+counts[1])-1;
        // var isUp = counts[0] > counts[1],
        //     fraction = (counts[0] == counts[1] ? 0 : 1) * (isUp ? 1 : -1) * (2 * counts[isUp ? 0 : 1] / (counts[0] + counts[1]) - 1);
            // fraction = (counts[0] == counts[1] ? 0 : 1) * (isUp ? 1 : -1) * (2 * counts[isUp ? 0 : 1] / group.get('members').length - 1);
        $container.css({ 
          // backgroundColor: mapper.fractionToGreenRedHex(fraction, true)
          backgroundColor: 'rgb(' + mapper.fractionToGreenRedHex(fraction) + ')'
        });
        return null;
      }}
    ],
    index: [
      { $:'.value', field:'value', formatter:mapper.Template.blankIfNull(mapper.Template.commaFormat) },
      // { $:'.change', field:'changePct', formatter:mapper.Template.blankIfNull(mapper.Template.postfix(mapper.Template.changeFormat, '%')) },
      { $:'.change', field:'change', formatter:mapper.Template.blankIfNull(mapper.Template.changeFormat) },
      { $:null, field:'changePct', formatter:function(changePct, $container) {
        if(changePct == null) return;
        $container.css({ 
          backgroundColor: mapper.changePctToHex(changePct, 5)
        });
        return null;
      }}
    ]
  };
  
  mapper.SmartGroupsView = SmartGroupsView;
  function SmartGroupsView(groups, $groups, $title) {
    _.extend(this, Backbone.Events);
    var _this = this,
        getGroupHtml = mapper.config.getGroupTagHtml || function(group) {
          return [
            '<div class="val_right counts"></div>',
            '<label>', group.get('label'), '</label>'
          ].join('');
        },
        template = new mapper.Template(
          $.extend(GroupsView.defaultBindings, mapper.config.getGroupBindings && mapper.config.getGroupBindings(GroupsView.defaultBindings))
        ),
        selected = null;
        
    var clusters = [],
        currCluster, currCategory;
    _.each(
      mapper.config.groupsTagOrder || groups.models,
      function(refOrGroup) {
        var group, category;
        if(typeof(refOrGroup) == 'string') {
          var splt = refOrGroup.split(':');
          group = groups.where({ category:splt[0], nickname:splt[1] })[0];
        }
        else group = refOrGroup;
        
        if(!group) return;
        
        if((category = group.get('category')) != currCategory) {
          currCategory = category;
          currCluster = { category:category, groups:[] };
          clusters.push(currCluster);
        }
        currCluster.groups.push(group);
      }
    );
    
    if(mapper.perf.animate != false) {
      setTimeout(function() {
        $groups.addClass('animated');
      }, 0);
    }
    
    $groups.show();
    var width,
        gap = 6,
        pad = 3,
        line = 1,
        tagH = 15,
        tagW = null,
        schemes = [],
        scheme,
        table;
        
    this.setSelected = function(group) {
      if(selected) {
        selected._groupView.$tag.removeClass('selected');
      }
      selected = group;
      if(selected) {
        selected._groupView.$tag.addClass('selected');
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
          group._groupView.$tag.addClass('search_result');
        });
      }
    };
    
    (this.resize = function() {
      width = $groups.width();
      scheme = pickScheme();
      
      tagW = Math.floor((width - gap * scheme.numCols - gap/2) / scheme.numCols);
      $groups.css({ height:(tagH + 2 * pad) * scheme.numRows });

      table = scheme.getTable();
      for(var r = 0; r < scheme.numRows; r++) {
        for(var c = 0; c < scheme.numCols; c++) {
          var obj = table[r][c];

          if(obj && obj.isLabel) addLabel(obj, c, r);
          else obj && addGroup(obj, c, r);
        }
      }
    })();
    
    // -------------
    
    function addLabel(label, c, r) {
      var group = label.group,
          $label = group._groupView && group._groupView.$label;
      if(!$label) {
        group._groupView = group._groupView || {};
        $label = group._groupView.$label = $(document.createElement('div'))
          .addClass('category')
          .html(group.get('category'))
          .appendTo($groups);
      }
        
      $label.css({
        width: tagW + (table[r][c+1] && (table[r][c+1].isLabel || table[r][c+1].get('category') != label) ? 0 : gap/2 - line),
        height: tagH + (r == 0 ? gap/2 : 0) + gap/2 - line,
        left: c * (tagW + gap) + gap/2,
        top: r * (tagH + gap)
      });
    }
    
    function addGroup(group, c, r) {
      var $tag = group._groupView && group._groupView.$tag;
      if(!$tag) {
        group._groupView = group._groupView || {};
        $tag = group._groupView.$tag = $(document.createElement('div'))
          .addClass('group')
          .html(getGroupHtml(group, $tag))
          .appendTo($groups)
          .click(function() {
            _this.trigger('select_group', group);
          });
        
        group.on('change', updateGroup);
        updateGroup(group);
      
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
      }
      
      $tag.css({
        width: tagW + (scheme.shouldExtend(group, c+1, r) ? gap/2 - line : 0) + (scheme.shouldExtend(group, c-1, r) ? gap/2 : 0) - pad*2,
        height: tagH + (scheme.shouldExtend(group, c, r+1) ? gap/2 - line : 0) + (scheme.shouldExtend(group, c, r-1) ? gap/2 : 0) - pad*2,
        left: c * (tagW + gap) + (scheme.shouldExtend(group, c-1, r) ? 0 : gap/2),
        top: r * (tagH + gap) + (scheme.shouldExtend(group, c, r-1) ? 0 : gap/2),
        padding: pad
      });
    }
    
    function updateGroup(group) {
      var bindingsName = (mapper.config.getGroupType && mapper.config.getGroupType(group.get('category'), group)) || group.get('category');
      template.applyBindings(bindingsName, group._groupView.$tag, group);
    }
    
    function pickScheme() {
      if(!width) return;
      var i = 0,
          _scheme;
      while(true) {
        _scheme = schemes[i] || new Scheme(clusters, i+2);
        if(width / _scheme.numCols >= 140 || i > 20) break;//140 for blufin, 127 for nyse
        i++;
      }
      return _scheme;
    }
  }
  
  function Scheme(clusters, numRows) {
    this.numRows = numRows;
    this.table = null;
    
    var col, row,
        _this = this;
    run(true);
    
    this.getTable = function() {
      if(this.table) return this.table;
      this.table = [];
      for(var r = 0; r < this.numRows; r++) { this.table.push([]); }
      run();
      return this.table;
    };
    
    this.shouldExtend = function(group, toCol, toRow) {
      var target = this.table[toRow] && this.table[toRow][toCol];
      if(target) {
        if(target.isLabel) return target.group.get('category') == group.get('category');
        else if(target.get('category') == group.get('category')) return true;
        return false;
      }
      else {
        if(toCol < 0 || toCol >= this.numCols ) return false;
        else if(!this.table[toRow]) return true;
        return this.shouldExtend(group, toCol, toRow - 1);
      }
    };
    
    function run(dryRun) {
      col = 0;
      row = 0;
      _.each(clusters, function(cluster) {
        if(row == 0) {
          placeCluster(cluster, dryRun);
        }
        else {
          if(row + 1 + cluster.groups.length <= _this.numRows) {
            placeCluster(cluster, dryRun);
          }
          else {
            row = 0;
            col++;
            placeCluster(cluster, dryRun);
          }
        }
      });
      _this.numCols = col + (row == 0 ? 0 : 1);;
    }
    
    function placeCluster(cluster, dryRun) {
      var len = cluster.groups.length;
      
      if(!dryRun) _this.table[row][col] = { isLabel:true, group:cluster.groups[0] };
      row++;
      
      _.each(cluster.groups, function(group, i) {
        if(!dryRun) _this.table[row][col] = group;
        row++;
        if(row > _this.numRows - 1) {
          row = (i == len - 1) ? 0 : 1;
          col++;
        }
      });
    };
  }
  
  /* --------------------------------------------------------------------------------- */

  mapper.GroupsView = GroupsView;
  function GroupsView($groups, groups) {
    _.extend(this, Backbone.Events);
    var _this = this,
        selected = null,
        getGroupHtml = mapper.config.getGroupTagHtml || function(group) {
          return [
            '<div class="category">', group.get('category').toUpperCase(), '</div>', 
            '<label>', group.get('label'), '</label>'
          ].join('');
        },
        template = new mapper.Template(
          $.extend(GroupsView.defaultBindings, mapper.config.getGroupBindings && mapper.config.getGroupBindings(GroupsView.defaultBindings))
        );

    // If tags order is explicitly defined in config, use it. Otherwise, assume all groups 
    // should be added, and create tagsOrder based on that.
    var tagsOrder = _.map(
      mapper.config.groupsTagOrder || groups.models,
      function(refOrGroup) {
        var reference, group;
        if(typeof(refOrGroup) == 'string') {
          reference = refOrGroup;
          
          var splt = reference.split(':'),
              category = splt[0],
              nickname = splt[1];
          group = groups.where({ category:category, nickname:nickname })[0];
        }
        else {
          reference = refOrGroup.get('urlName');
          group = refOrGroup;
        }
        return { reference:reference, group:group };
      }
    );
    
    var sections = [],
        current = null;
    _.forEach(tagsOrder, function(obj) {
      var category = obj.reference.split(':')[0];
      if(!current || current != category) {
        current = category;
        sections.push({ category:category, tags:[] });
      }
      sections[sections.length - 1].tags.push(obj);
    });

    var w = $groups.width(),
        gap = 1,
        numCols = Math.floor(w / 150),
        tagW = Math.floor((w - gap * numCols) / numCols);
    _.forEach(sections, function(section) {
      var $section = $(document.createElement('div')).addClass('section').html('<div class="category">' + section.category + '</div>');
      _.forEach(section.tags, function(tag) {
        var group = tag.group;
        group._groupView = group._groupView || {};
        var $tag = group._groupView.$tag = $(document.createElement('div'))
          .addClass('group')
          .html(getGroupHtml(group, $tag))
          .css({
            width: tagW - 8,
            padding:4
          })
          .appendTo($section)
          .click(function() {
            _this.trigger('select_group', group);
          });
        
        group.on('change', updateGroup);
        updateGroup(group);
      });
      $section.appendTo($groups);
    });
    
    this.setSelected = function(group) {
      if(selected) {
        selected._groupView.$tag.removeClass('selected');
      }
      selected = group;
      if(selected) {
        selected._groupView.$tag.addClass('selected');
        $groups.addClass('dimmed');
      }
      else {
        $groups.removeClass('dimmed');
      }
    };

    function updateGroup(group) {
      var bindingsName = (mapper.config.getGroupType && mapper.config.getGroupType(group.get('category'), group)) || group.get('category');
      template.applyBindings(bindingsName, group._groupView.$tag, group);
    }
  }
})();