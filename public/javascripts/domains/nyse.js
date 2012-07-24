mapper.config.getTagHtml = function(model) {
  var sym = model.get('sym');
  sym.match(/^(\w*)\-?(\w*)$/);
  return RegExp.$1 + (RegExp.$2 ? '<span>' + RegExp.$2 + '</span>' : '');
};
mapper.config.getGroupHtml = function(group, $container) {
  return [
    '<div class="val_right counts"></div>',
    '<div class="type">', group.get('type').toUpperCase(), '</div>', 
    '<label>', group.get('label'), '</label>'
  ].join('');
};

mapper.config.getGroupType = function(type, group) {
  if(type == 'index') { return type; };
  return 'group';
};

mapper.config.getInspectorBindings = function() { 
  return {
    group: [
      { $:'.type', field:'type', formatter:function(val) { return 'Stocks by ' + mapper.capitalize(val); } },
      { $:'.label', field:'name' }
    ],
    index: [
      { $:'.name', field:'name' },
      { $:'.sym', field:'sym' }
    ]
  };
};