var ViewState = mapper.ViewState = Backbone.Model.extend(
  {
    toUrl: function() {
      return '/?' + this.toParamsString();
    },
    
    fromUrl: function(url) {
      url.match(/\?(.*)$/);
      var paramsString = RegExp.$1 || null,
          params = paramsString && paramsString.split('&'),
          attribs = {
            filter: null,
            sort: null
          };
          
      _.forEach(params, function(param) {
        param.match(/(.*)\=(.*)/);
        attribs[RegExp.$1] = RegExp.$2;
      });
      
      this.set(attribs);
    },
    
    toParamsString: function() {
      var val, 
          output = '',
          _this = this;
      ViewState.urlParams.forEach(function(param) {
        val = _this.attributes[param];
        if(val) output += (output.length ? '&' : '') + param + '=' + val;
      });
      return output;
    }
  },
  {
    urlParams: ['filter', 'sort']
  }
);