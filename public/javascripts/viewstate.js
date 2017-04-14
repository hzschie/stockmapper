var ViewState = mapper.ViewState = Backbone.Model.extend(
  {
    defaults: {
      currentSort: mapper.sortFunctions['sym']// is this needed???
    },
    initialize: function() {
      var _this = this;
      (function(window, undefined){
          var History = window.History;
          if ( !History.enabled ) return;

          History.Adapter.bind(window, 'statechange', function(){
            var state = History.getState();
            _this.fromUrl(state.url);
          });
          var initState = History.getState();
          _this.urlBase = initState.hash.split('?')[0];// '/' or '/mapper'
          _this.fromUrl(initState.url, true);
      })(window);
    },
    
    setState: function(hash, urlBase) {
      if(urlBase) { this.urlBase = urlBase; }
      History.pushState(null, null, this.urlBase + '?' + this.toParamsString(hash));
    },
    
    fromUrl: function(url, force) {
      this.urlBase = window.location.pathname;// '/' or '/mapper'
      var matches = url.match(/\?(.*)$/),
          paramsString = matches && matches[1] || null,
          params = paramsString && paramsString.split('&'),
          oldAttribs = this.attributes,
          newAttribs = {
            filter: null,
            sort: null,
            cluster: null,
            change_from: null,
            q: null,
            range: null,
            compare: null,
            mobile: null
          },
          _this = this;
          
      _.forEach(params, function(param) {
        param.match(/(.*)\=(.*)/);
        var key = RegExp.$1,
            val = RegExp.$2;
        newAttribs[key] = val;
      });
      
      for(var key in newAttribs) {
        var val = newAttribs[key];
        if((oldAttribs[key] != val) || force) {
          if(key == 'filter') {
            var currentGroup = val && mapper.groups.where({ urlName:val })[0] || _this.get('defaultGroup'),
                currentSort = newAttribs.currentSort !== undefined ? newAttribs.currentSort : _this.get('currentSort');
            currentGroup && currentGroup.set({ comparator: currentSort });
            newAttribs.currentGroup = currentGroup;
          }

          if(key == 'sort') {
            var currentSort = val && mapper.sortFunctions[val] || _this.get('defaultSort'),
                currentGroup = newAttribs.currentGroup !== undefined ? newAttribs.currentGroup : _this.get('currentGroup');
            currentGroup && currentGroup.set({ comparator: currentSort });
            newAttribs.currentSort = currentSort;
          }

          if(key == 'q') {
            var currentStock = mapper.stocks.get(val);
            newAttribs.currentStock = currentStock;
          }
        }
      }
      newAttribs.urlBase = this.urlBase;

      this.set(newAttribs);

      var pageGroup = this.get('currentGroup')
      var pageStock = this.get('currentStock')


      var pageTitle = ''
      var stockStr = pageStock ? pageStock.get('sym') : ''

      if (pageGroup.get('label') == 'SHOW ALL') {
        pageTitle = stockStr
      }
      else if (pageGroup.get('category') === 'Index') {
        pageTitle = (stockStr ? stockStr + ' \\ ' : '') + pageGroup.get('name')
      }
      else {
        pageTitle = (stockStr ? stockStr + ' \\ ' : '') + pageGroup.get('category') + ': ' + pageGroup.get('name')
      }

      var clusterStr = this.get('cluster');
      var sortStr = this.get('currentSort').id;
      var pageUrl = pageGroup.get('urlName').toLowerCase() + '/per-' + (clusterStr || '*') + '/by-' + sortStr + '/' + stockStr

      document.title = pageTitle + (pageTitle ? ' — ' + 'Stockmapper' : 'Stockmapper')

      ga(function(tracker) {
        var currPageUrl = tracker.get('page');
        if (currPageUrl !== pageUrl) {
          ga('set', 'page', pageUrl);
          ga('send', 'pageview');
        }
      });
    },
    
    toParamsString: function(hash) {
      var val, 
          output = '',
          _this = this;
      _.forEach(this.get('trackedParams'), function(param) {
        val = hash[param] === undefined ? _this.attributes[param] : hash[param];
        if(val) output += (output.length ? '&' : '') + param + '=' + val;
      });
      return output;
    }
  }
);