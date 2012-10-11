// Initialize view and Historty
mapper.dataReady = function() {
  // Init views on document ready
  $(mapper.isMobile ? mapper.Mobile.ready : function() {
    var groups = new mapper.SmartGroupsView(mapper.groups, $('.panel .groups'), $('.panel .title')),
        sorts = new mapper.SelectorButtons($('.panel .sorts'), function(id) { viewState.setState({ sort:id }); }),
        map = new mapper.Map($('.map ul')),
        highlights = new mapper.MapHighlights($('.map .highlights')),
        chart = new mapper.HtmlChart($('.chart')),
        inspector = new mapper.Inspector($('.inspector')),
        stockDetails = new mapper.Details($('#stock_details')),
        indexDetails = new mapper.Details($('#index_details'), { graphVolume:false }),
        search = new mapper.Search($('.search')),
        lastUpdate = new mapper.GlobalLastUpdate($('#global_last_update'), mapper.stocks),
        viewState = new mapper.ViewState({
          defaultGroup: mapper.allGroup,
          defaultSort: mapper.sortFunctions.sym,
          trackedParams: ['filter', 'sort', 'q', 'range']
        }),
        layout = new mapper.Layout(groups, indexDetails, map, chart, inspector, stockDetails);
    
    function updateView(force) {
      if(viewState.hasChanged('currentGroup') || force) {
        var currentGroup = viewState.get('currentGroup');
        map.setModels(currentGroup.get('members'));
        chart.setModels(currentGroup.get('members'));
        groups.setSelected(currentGroup);
        indexDetails.query(currentGroup);
        inspector.suspendTillDone(map);
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
      
      if(viewState.hasChanged('range') || force) {
        stockDetails.setRange(viewState.get('range'));
        indexDetails.setRange(viewState.get('range'));
      }
      
      if(viewState.hasChanged('searchStock')) {
        var searchStock = viewState.get('searchStock');
        map.search(searchStock);
        groups.search(searchStock);
        
        if(searchStock) {
          stockDetails.close();
        }
      }
    }
    
    updateView(true);
    viewState.on('change', function() { updateView(false); });

    groups.on('select_group', function(group) {
      viewState.setState({ filter: group.get('urlName'), q: null });
    });
    groups.on('inspect_group', function(group, $tag) {
      inspector.inspectGroup(group, $tag);
    });
    
    layout.on('select_view', function(viewName) {
      viewState.setState({ q: null });
    });
    
    search.on('select_option', function(model) {
      viewState.set({ searchStock: model });
    });
    search.on('commit_option', function(model) {
      viewState.setState({ q: (model && model.id) || null });
    });
    
    map.on('select_tag', function(model, $tag) {
      viewState.setState({ q: model.id });
    });
    map.on('inspect_tag', function(model, $tag) {
      inspector.inspectTag(model, $tag);
    });
    
    chart.on('select_bar', function(model, $bar) {
      viewState.setState({ q: model.id });
    });
    chart.on('inspect_bar', function(model, $subBar, isVol, yFixed) {
      inspector.inspectBar(model, $subBar, isVol, yFixed);
    });
    
    stockDetails.on('click_close', function() {
      viewState.setState({ q: null });
    });
    stockDetails.on('select_range', function(range) {
      viewState.setState({ range: range });
    });
    indexDetails.on('select_range', function(range) {
      viewState.setState({ range: range });
    });
  });
};