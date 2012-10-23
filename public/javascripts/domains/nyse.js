mapper.config.getGroupType = function(category, group) {
  if(category == 'index') { return category; };
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

mapper.config.getGroupTagHtml = function(group, $container) {
  if(group.get('category') == 'index') return [
      '<div class="val_right">',
        '<div class="value"></div>',
        '<div class="change"></div>',
      '</div>',
      '<label>', group.get('label'), '</label>'
    ].join('');
  else return [
      '<div class="val_right counts"></div>',
      '<label>', group.get('label'), '</label>'
    ].join('');
};
