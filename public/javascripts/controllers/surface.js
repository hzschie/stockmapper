(function() {
  var getGroupsView = mapper.config.getGroupsView;
  
  mapper.Surface = Surface;
  function Surface() {}
  
  Surface.init = function() {
    var groups = getGroupsView ? 
          getGroupsView(mapper.groups, $('.panel .groups'), $('.map .title')) : 
          new mapper.SmartGroupsView(mapper.groups, $('.panel .groups'), $('.map .title')),
        sorts = new mapper.SelectorButtons($('.panel .sorts'), function(id) { viewState.setState({ sort:id }); }),
        views = new mapper.SelectorButtons($('.panel .views'), viewSelected),
        map = new mapper.Map($('.layout .map ul')),
        clustering = new mapper.ClusteringSelector($('.map .clustering'), function(id) { viewState.setState({ cluster:id }); }),
        highlights = new mapper.MapHighlights($('.map .highlights')),
        chart = new mapper.HtmlChart($('.chart')),/* STUB: { setModels:function(){}, on:function(){}, resize:function(){} } */
        inspector = new mapper.Inspector($('.inspector')),
        stockDetails = new mapper.Details($('#stock_details')),
        indexDetails = new mapper.Details($('#index_details'), { graphVolume:false }),
        search = new mapper.Search($('.panel .search')),
        lastUpdate = new mapper.GlobalLastUpdate($('#global_last_update'), [mapper.stocks, mapper.groups]),
        viewState = new mapper.ViewState({
          defaultGroup: mapper.allGroup,
          defaultSort: mapper.sortFunctions.chg,
          trackedParams: ['filter', 'sort', 'cluster', 'q', 'range', 'compare']
        }),
        layout = new mapper.Layout(groups, indexDetails, views, map, chart, inspector, stockDetails);
        
    // The public instance, exposes certain properties and methods to facilitate extending its functionality
    var instance = {
      inspectTag: function(model, $tag) {
        inspector.inspectTag(model, $tag);
      },
      query: function(model) {
        viewState.setState({ q: model.id, compare:null });
      },
      onUpdateView: function(force, viewState) { /* can be implemented vy extending class */ }
    };

    function updateView(force) {
      if(viewState.hasChanged('currentGroup') || force) {
        var currentGroup = viewState.get('currentGroup');
        map.setModels(currentGroup.get('members'), currentGroup.get('category'));
        chart.setModels(currentGroup.get('members'));
        groups.setSelected(currentGroup);
        inspector.suspendTillDone(map);

        if(currentGroup.get('type') == 'index') {
          setTimeout(function() {
            views.enable('index');
            indexDetails.query(currentGroup);
          }, 1000);
        }
        else {
          setTimeout(function() {
            views.disable('index');
            indexDetails.query(null);
          }, 1000);
        }
      }

      if(viewState.hasChanged('currentSort') || force) {
        sorts.setCurrent(viewState.get('currentSort').id);
      }

      if(viewState.hasChanged('currentStock') || force) {
        var currentStock = viewState.get('currentStock');
        stockDetails.query(currentStock);
        map.search(currentStock);
        groups.search(currentStock);
      }

      if(viewState.hasChanged('cluster') || force) {
        clustering.setCurrent(viewState.get('cluster'));
        map.clusterBy(viewState.get('cluster'));
      }

      if(viewState.hasChanged('range') || force) {
        stockDetails.setRange(viewState.get('range'));
        indexDetails.setRange(viewState.get('range'));
      }

      if(viewState.hasChanged('compare') || force) {
        var symbols = viewState.get('compare');
        symbols = symbols ? symbols.split(',') : [];
        stockDetails.setCompareSymbols(symbols);
      }

      if(viewState.hasChanged('searchStock')) {
        var searchStock = viewState.get('searchStock');
        map.search(searchStock);
        groups.search(searchStock);

        if(searchStock) {
          stockDetails.close();
        }
      }
      
      instance.onUpdateView(force, viewState);
    }

    viewState.on('change', function() { updateView(false); });
    setTimeout(function() { updateView(true); }, 0);

    function viewSelected(id) {
      viewState.setState({ q: null, compare:null });
      layout.frameView(id);
    }

    groups.on('select_group', function(group) {
      viewState.setState({ filter: group.get('urlName'), q: null, compare:null });
    });
    groups.on('inspect_group', function(group, $tag) {
      inspector.inspectGroup(group, $tag);
    });

    search.on('select_option', function(model) {
      viewState.set({ searchStock: model });
    });
    search.on('commit_option', function(model) {
      if(model && model.constructor == mapper.StockGroup) {
        viewState.setState({ filter: model.get('urlName'), q: null, compare:null });
      }
      else {
        viewState.setState({ q: (model && model.id) || null, compare:null });
      }
    });
    search.on('focus_field', function() {
      stockDetails.close();
    });

    map.on('select_tag', function(model, $tag) {
      viewState.setState({ q: model.id, compare:null });
    });
    map.on('inspect_tag', function(model, $tag) {
      inspector.inspectTag(model, $tag);
    });

    chart.on('select_bar', function(model, $bar) {
      viewState.setState({ q: model.id, compare:null });
    });
    chart.on('inspect_bar', function(model, $subBar, isVol, yFixed) {
      inspector.inspectBar(model, $subBar, isVol, yFixed);
    });

    stockDetails.on('click_close', function() {
      viewState.setState({ q: null, compare:null });
    });
    stockDetails.on('select_range', function(range) {
      viewState.setState({ range: range });
    });
    indexDetails.on('select_range', function(range) {
      viewState.setState({ range: range });
    });
    stockDetails.on('change_comparison', function(symbols) {
      viewState.setState({ compare: !symbols || symbols.length == 0 ? null : symbols });
    });
    
    return mapper.surface = instance;
  };
})();
