// Initialize view and Historty
mapper.dataReady = function() {
  // Init views on document ready
  $(function() {
    if(mapper.isMobile) {
      var groupsView = new mapper.GroupsView($('.groups'), mapper.groups);
      return;
    }
    
    var panel = new mapper.Panel($('.panel'), mapper.groups),
        map = new mapper.Map($('.map')),
        chart = new mapper.HtmlChart($('.chart')),
        inspector = new mapper.Inspector($('.inspector')),
        details = new mapper.Details($('.details')),
        viewState = new mapper.ViewState(),
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
    }
    
    updateView(true);
    viewState.on('change', function() { updateView(false); });

    panel.on('select_group', function(group) {
      viewState.set({ filter: group.get('urlName'), q: null }, { silent: true });
      History.pushState(null, null, viewState.toUrl());
    });
    
    panel.on('select_sort', function(sortVal) {
      viewState.set({ sort: sortVal }, { silent: true });
      History.pushState(null, null, viewState.toUrl());
    });
    
    map.on('select_tag', function(model, $tag) {
      viewState.set({ q: model.id }, { silent: true });
      History.pushState(null, null, viewState.toUrl());
    });
    
    panel.on('select_view', function(viewName) {
      layout.frameView(viewName);
    });
    
    panel.on('inspect_group', function(group, $tag) {
      inspector.inspectGroup(group, $tag);
    });
    
    map.on('inspect_tag', function(model, $tag) {
      inspector.inspectTag(model, $tag);
    });
    
    chart.on('inspect_bar', function(model, $subBar, isVol, yFixed) {
      inspector.inspectBar(model, $subBar, isVol, yFixed);
    });
    
    details.on('click_close', function() {
      viewState.set({ q: null }, { silent: true });
      History.pushState(null, null, viewState.toUrl());
    });
    
    details.on('select_range', function(range) {
      viewState.set({ range: range }, { silent: true });
      History.pushState(null, null, viewState.toUrl());
    });
  });
};