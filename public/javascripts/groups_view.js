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