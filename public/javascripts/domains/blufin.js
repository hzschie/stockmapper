mapper.config.processInspectorBindings = function(bindings) {
  _.find(bindings, function(binding) { return binding.$ == '.sym'; }).formatter = function(val, $field) {
    if(val.length >= 10) return '<span class="tight">' + val + '</span>';
    return val;
  };
};

mapper.config.getTagHtml = function(model) {
  var sym = model.get('sym');
  if(sym.length >= 11 &&
    (sym == "WINDSOR MACH" || sym == "VARDHMNPOLY" || sym == "MUNJALSHOWA" || sym == "INDORAMASYN")) {
      return '<span class="tight">' + sym + '</span>';
  }
  return sym;
};