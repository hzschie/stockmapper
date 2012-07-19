mapper.config.processInspectorBindings = function(bindings) {
  _.find(bindings, function(binding) { return binding.$ == '.sym'; }).formatter = function(val, $field) {
    if(val.length >= 10) $field.addClass('tight');
    else $field.removeClass('tight');
    return val;
  };
};