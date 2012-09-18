/* Algo TODO:
  Calculate numCols
  (Build scheme, wrapping a column if group.length + currRow > maxRows
  Calculate height for each scheme, where maxRows is 2->n.
  If cols(n) is > numCols, reject
  Else, accept scheme
*/

(function() {
  GroupsView.defaultBindings = {
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
  
  mapper.SmartGroupsView = SmartGroupsView;
  function SmartGroupsView($groups, groups) {
    _.extend(this, Backbone.Events);
    var _this = this,
        getGroupHtml = mapper.config.getPanelGroupHtml || function(group) {
          return [
            '<div class="type">', group.get('type').toUpperCase(), '</div>', 
            '<label>', group.get('label'), '</label>'
          ].join('');
        },
        template = new mapper.Template(
          $.extend(GroupsView.defaultBindings, mapper.config.getGroupBindings && mapper.config.getGroupBindings(Panel.defaultBindings))
        );
        
    var w = $groups.width(),
        gap = 6,
        pad = 3,
        numCols,
        tagW,
        tagH;
    $groups.css({ height:300 });//TEMP
    function addLabel(label, c, r) {
      var $tag = $(document.createElement('div'))
        .addClass('label')
        .html(label)//.toUpperCase())
        .css({
          width: tagW + (typeof(table[r][c+1]) == 'string' || (table[r][c+1] && table[r][c+1].get('type') != label) ? 0 : gap/2 - 1),
          height: tagH + (r == 0 ? gap/2 : 0) + gap/2 - 1,
          left: c * (tagW + gap) + gap/2,
          top: r * (tagH + gap) + (r == 0 ? 0 : gap/2)
        })
        .appendTo($groups);
    }
    function addGroup(group, c, r) {
      var $tag = $(document.createElement('div'))
        .addClass('group')
        .html(getGroupHtml(group, $tag))
        .css({
          width: tagW + (shouldExtend(group, c+1, r) ? gap/2 - 1 : 0) + (shouldExtend(group, c-1, r) ? gap/2 : 0) - pad*2,
          height: tagH + (shouldExtend(group, c, r+1) ? gap/2 - 1 : 0) + (shouldExtend(group, c, r-1) ? gap/2 : 0) - pad*2,
          left: c * (tagW + gap) + (shouldExtend(group, c-1, r) ? 0 : gap/2),
          top: r * (tagH + gap) + (shouldExtend(group, c, r-1) ? 0 : gap/2),
          padding: pad
        })
        .appendTo($groups)
        .click(function() {
          _this.trigger('select_group', group);
        });

      group.set({ $tag2: $tag }, { silent:true });
      group.on('change', updateGroup);
      updateGroup(group);
    }
    function shouldExtend(group, toCol, toRow, iteration) {
      iteration = iteration || 0;
      if(iteration > 20) throw Error('too much');
      var target = table[toRow] && table[toRow][toCol];
      if(target) {
        if(typeof(target) == 'string') return target == group.get('type');
        else if(target.get('type') == group.get('type')) return true;
        return false;
      }
      else {
        if(toCol < 0 || toCol >= numCols ) return false;
        else if(!table[toRow]) return true;
        return shouldExtend(group, toCol, toRow - 1, iteration+1);
      }
    }
    function updateGroup(group) {
      var type = (mapper.config.getGroupType && mapper.config.getGroupType(group.get('type'), group)) || group.get('type');
      template.applyBindings(type, group.get('$tag2'), group);
    }
    
    // ---------------------------------
    var clusters = [],
        currCluster, currType;
    _.each(
      mapper.config.groupsTagOrder || groups.models,
      function(refOrGroup) {
        var group, type;
        if(typeof(refOrGroup) == 'string') {
          var splt = refOrGroup.split(':');
          group = groups.where({ type:splt[0], nickname:splt[1] })[0];
        }
        else group = refOrGroup;
        
        if((type = group.get('type')) != currType) {
          currType = type;
          currCluster = { type:type, groups:[] };
          clusters.push(currCluster);
        }
        currCluster.groups.push(group);
      }
    );
    
    var numRows = 6,//8,//6,
        col = 0,
        row = 0,
        table = [],
        placeCluster = function(cluster) {
          var len = cluster.groups.length;
          
          table[row][col] = cluster.type;
          row++;
          
          _.each(cluster.groups, function(group, i) {
            table[row][col] = group;
            row++;
            if(row > numRows - 1) {
              row = (i == len - 1) ? 0 : 1;
              col++;
            }
          });
        };
        
    for(var r=0; r<numRows; r++) { table.push([]); }
    
    _.each(clusters, function(cluster) {
      if(row == 0) {
        placeCluster(cluster);
      }
      else {
        if(row + 1 + cluster.groups.length <= numRows) {
          placeCluster(cluster);
        }
        else {
          row = 0;
          col++;
          placeCluster(cluster);
        }
      }
    });
    
    numCols = col + (row == 0 ? 0 : 1);
    tagW = Math.floor((w - gap * numCols) / numCols);
    tagH = 14;
    
    var output = '',
        strPad = '           ';//'                    ';
    for(var r = 0; r < table.length; r++) {
      for(var c = 0; c < table[r].length; c++) {
        var obj = table[r][c];
        
        if(obj && typeof(obj) == 'string') addLabel(obj, c, r);
        else obj && addGroup(obj, c, r);
        
        if(obj) {
          output += (obj = (typeof(obj) == 'string' ? ":: " + obj + " ::" : obj.get('nickname')).substr(0, strPad.length-1));
          output += strPad.substring(0, strPad.length - obj.length);
        }
        else output += strPad;
      }
      output += '\n';
    }
    console.log(output);
    // console.log("ends at col", col, "row", row);
  }
  
  /* --------------------------------------------------------------------------------- */

  mapper.GroupsView = GroupsView;
  function GroupsView($groups, groups) {
    _.extend(this, Backbone.Events);
    var _this = this,
        getGroupHtml = mapper.config.getPanelGroupHtml || function(group) {
          return [
            '<div class="type">', group.get('type').toUpperCase(), '</div>', 
            '<label>', group.get('label'), '</label>'
          ].join('');
        },
        template = new mapper.Template(
          $.extend(GroupsView.defaultBindings, mapper.config.getGroupBindings && mapper.config.getGroupBindings(Panel.defaultBindings))
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
              type = splt[0],
              nickname = splt[1];
          group = groups.where({ type:type, nickname:nickname })[0];
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
      var type = obj.reference.split(':')[0];
      if(!current || current != type) {
        current = type;
        sections.push({ type:type, tags:[] });
      }
      sections[sections.length - 1].tags.push(obj);
    });

    var w = $groups.width(),
        gap = 2,
        numCols = Math.floor(w / 150),
        tagW = Math.floor((w - gap * numCols) / numCols);
    _.forEach(sections, function(section) {
      var $section = $(document.createElement('div')).addClass('section').html('<div class="type">' + section.type + '</div>');
      _.forEach(section.tags, function(tag) {
        var group = tag.group;
        var $tag = $(document.createElement('div'))
          .addClass('group')
          .html(getGroupHtml(group, $tag))
          .css({
            width: tagW,
            margin: gap/2
          })
          .appendTo($section)
          .click(function() {
            _this.trigger('select_group', group);
          });
              
        group.set({ $tag: $tag }, { silent:true });
        group.on('change', updateGroup);
        updateGroup(group);
      });
      $section.appendTo($groups);
    });

    function updateGroup(group) {
      var type = (mapper.config.getGroupType && mapper.config.getGroupType(group.get('type'), group)) || group.get('type');
      template.applyBindings(type, group.get('$tag'), group);
    }
  }
})();