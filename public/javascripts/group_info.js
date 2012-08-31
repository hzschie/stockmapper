(function() {
  mapper.GroupInfo = GroupInfo;
  var Template = mapper.Template;
  GroupInfo.defaultBindings = {
    group: [
      { $:'.type', field:'type', formatter:function(val) { return 'Stocks by ' + mapper.capitalize(val); } },
      { $:'.label', field:'name' },
      { $:'.num_up', field:'upsAndDowns', formatter:function(counts) { return counts[0]; } },
      { $:'.num_down', field:'upsAndDowns', formatter:function(counts) { return counts[1]; } },
      { $:'.volume_up', field:'volumeUp', formatter:mapper.Template.commaFormat },
      { $:'.volume_down', field:'volumeDown', formatter:mapper.Template.commaFormat },
      { $:'.volume_total', field:'volumeTotal', formatter:mapper.Template.commaFormat }
    ]
  };
  function GroupInfo($container) {
    var group = null,
        template = new mapper.Template(
          $.extend(GroupInfo.defaultBindings, mapper.config.getInspectorBindings(GroupInfo.defaultBindings))
        );
    
    this.setGroup = function(_group) {
      if(group) group.off('change', update);
      group = _group;
      update();
      group.on('change', update);
    };
    
    function update() {
      $container.show();
      var type = (mapper.config.getGroupType && mapper.config.getGroupType(group.get('type'), group)) || group.get('type');
      template.applyBindings(type, $container, group);
      
      $container.find('.content').removeClass('current');
      $container.find('.' + type).addClass('current');
    }
  }
})();