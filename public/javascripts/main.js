// Initialize view and Historty
mapper.dataReady = function() {
  // Init views on document ready
  $(mapper.isMobile ? mapper.Mobile.ready : function() {
    var panel = new mapper.Panel($('.panel'), mapper.groups),
        map = new mapper.Map($('.map')),
        chart = new mapper.HtmlChart($('.chart')),
        inspector = new mapper.Inspector($('.inspector')),
        details = new mapper.Details($('.details')),
        search = new mapper.Search($('.search')),
        viewState = new mapper.ViewState({
          defaultGroup: mapper.allGroup,
          defaultSort: mapper.sortFunctions.sym,
          trackedParams: ['filter', 'sort', 'q', 'range']
        }),
        layout = new mapper.Layout(panel, map, chart);
    
    function updateView(force) {
      if(viewState.hasChanged('currentGroup') || force) {
        var currentGroup = viewState.get('currentGroup');
        map.setModels(currentGroup.get('members'));
        chart.setModels(currentGroup.get('members'));
        panel.setSelectedGroup(currentGroup);
        inspector.suspendTillDone(map);
      }
      
      if(viewState.hasChanged('currentSort') || force) {
        panel.setSelectedSort(viewState.get('currentSort').id);
      }
      
      if(viewState.hasChanged('currentStock') || force) {
        details.query(viewState.get('currentStock'));
      }
      
      if(viewState.hasChanged('range') || force) {
        details.setRange(viewState.get('range'));
      }
      
      if(viewState.hasChanged('searchStock') || force) {
        var searchStock = viewState.get('searchStock');
        map.search(searchStock);
        panel.search(searchStock);
        
        if(searchStock) {
          details.close();
        }
      }
    }
    
    updateView(true);
    viewState.on('change', function() { updateView(false); });

    panel.on('select_group', function(group) {
      viewState.setState({ filter: group.get('urlName'), q: null });
    });
    panel.on('select_sort', function(sortVal) {
      viewState.setState({ sort: sortVal });
    });
    panel.on('inspect_group', function(group, $tag) {
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
    
    chart.on('inspect_bar', function(model, $subBar, isVol, yFixed) {
      inspector.inspectBar(model, $subBar, isVol, yFixed);
    });
    
    details.on('click_close', function() {
      viewState.setState({ q: null });
    });
    details.on('select_range', function(range) {
      viewState.setState({ range: range });
    });
  });
};