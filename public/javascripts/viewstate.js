var ViewState = mapper.ViewState = Backbone.Model.extend(
  {
    defaults: {
      currentSort: mapper.sortFunctions['sym']// is this needed???
    },
    initialize: function() {
      this.on('change', function() {
        if(this.hasChanged('filter')) {
          var name = this.get('filter'),
              currentGroup = !name ? mapper.allGroup : mapper.groups.where({ urlName:name })[0];

          if(currentGroup) {
            currentGroup.set({ comparator: this.get('currentSort') });
            this.set({
              currentGroup: currentGroup
            });
          }
          else
            throw new Error('Unknown group, ' + name);
        }

        if(this.hasChanged('sort')) {
          var sortId = this.get('sort') || 'sym',
              currentSort = mapper.sortFunctions[sortId];
          this.get('currentGroup').set({ comparator: currentSort });
          this.set({ currentSort: currentSort });
        }

        if(this.hasChanged('q')) {
          var currentStock = mapper.stocks.get( this.get('q') );
          this.set({ currentStock: currentStock });
        }

        // if(this.hasChanged('range')) {
        // }
      });
      
      var _this = this;
      (function(window, undefined){
          var History = window.History;
          if ( !History.enabled ) return;

          History.Adapter.bind(window, 'statechange', function(){
            var state = History.getState();
            _this.fromUrl(state.url);
          });
          _this.fromUrl(History.getState().url);
      })(window);
    },
    
    toUrl: function() {
      return '/?' + this.toParamsString();
    },
    
    fromUrl: function(url) {
      url.match(/\?(.*)$/);
      var paramsString = RegExp.$1 || null,
          params = paramsString && paramsString.split('&'),
          attribs = {
            filter: null,
            sort: null,
            q: null
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
    urlParams: ['filter', 'sort', 'q', 'range']
  }
);