var ViewState = mapper.ViewState = Backbone.Model.extend(
  {
    defaults: {
      filter: null
    },
    
    toUrl: function() {
      return '?' + this.toParamsString();
    },
    
    fromUrl: function(url) {
      url.match(/\?(.*)$/);
      var paramsString = RegExp.$1 || null,
          params = paramsString && paramsString.split('&'),
          attribs = {
            filter: null
          };
          
      _.forEach(params, function(param) {
        param.match(/(.*)\=(.*)/);
        attribs[RegExp.$1] = RegExp.$2;
      });
      
      this.set(attribs);
    },
    
    toParamsString: function() {
      var val, output = '';
      for(var param in this.attributes) {
        switch (typeof(val = this.attributes[param])) {
          case 'function': continue;
          default: {
            output += (output.length ? '&' : '') + param + '=' + val;
          }
        }
      }
      return output;
    }
  }
);