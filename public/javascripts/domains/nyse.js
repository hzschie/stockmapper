mapper.config.getGroupType = function(type, group) {
  if(type == 'index') { return type; };
  return 'group';
};

mapper.config.getInspectorBindings = function() { 
  return {
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
    '<label>', group.get('label'), '</label>'
  ].join('');
};
