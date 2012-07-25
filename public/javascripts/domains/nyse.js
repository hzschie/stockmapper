mapper.config.getGroupType = function(type, group) {
  if(type == 'index') { return type; };
  return 'group';
};

mapper.config.getInspectorBindings = function() { 
  return {
    group: [
      { $:'.type', field:'type', formatter:function(val) { return 'Stocks by ' + mapper.capitalize(val); } },
      { $:'.label', field:'name' },
      { $:'.num_up', field:'upsAndDowns', formatter:function(counts) { return counts[0]; } },
      { $:'.num_down', field:'upsAndDowns', formatter:function(counts) { return counts[1]; } },
      { $:'.volume_up', field:'volumeUp', formatter:mapper.Template.commaFormat },
      { $:'.volume_down', field:'volumeDown', formatter:mapper.Template.commaFormat },
      { $:'.volume_total', field:'volumeTotal', formatter:mapper.Template.commaFormat }
    ],
    index: [
      { $:'.name', field:'name' },
      { $:'.sym', field:'sym' }
    ]
  };
};

mapper.config.getMapTagHtml = function(model) {
  var sym = model.get('sym');
  sym.match(/^(\w*)\-?(\w*)$/);
  return RegExp.$1 + (RegExp.$2 ? '<span>' + RegExp.$2 + '</span>' : '');
};

mapper.config.getPanelGroupHtml = function(group, $container) {
  return [
    '<div class="val_right counts"></div>',
    '<div class="type">', group.get('type').toUpperCase(), '</div>', 
    '<label>', group.get('label'), '</label>'
  ].join('');
};
