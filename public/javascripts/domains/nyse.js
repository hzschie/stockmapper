mapper.config.getTagHtml = function(model) {
  var sym = model.get('sym');
  sym.match(/^(\w*)\-?(\w*)$/);
  return RegExp.$1 + (RegExp.$2 ? '<span>' + RegExp.$2 + '</span>' : '');
};