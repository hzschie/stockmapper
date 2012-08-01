// Initialize view and Historty
mapper.dataReady = function() {
  // Init views on document ready
  $(function() {
    var panel = new mapper.Panel($('.panel'), mapper.groups),
        map = new mapper.Map($('.map')),
        chart = new mapper.HtmlChart($('.chart')),
        inspector = new mapper.Inspector($('.inspector')),
        viewState = new mapper.ViewState(),
        layout = new mapper.Layout(panel, map, chart),
        currentGroup = null,
        currentSort = mapper.sortFunctions['sym'];
        
    viewState.on('change', function(viewState) {
      if(viewState.hasChanged('filter')) {
        var name = viewState.get('filter');
        currentGroup = !name ? mapper.allGroup : mapper.groups.where({urlName:name})[0];
        
        if(currentGroup) {
          currentGroup.set({ comparator: currentSort });
          map.setModels(currentGroup.get('members'));
          chart.setModels(currentGroup.get('members'));
          panel.setSelectedGroup(currentGroup);
          inspector.suspendTillDone(map);
        }
        else
          throw new Error('Unknown group, ' + name);
      }
      
      if(viewState.hasChanged('sort')) {
        var sortId = viewState.get('sort') || 'sym';
        currentSort = mapper.sortFunctions[sortId];
        currentGroup.set({ comparator: currentSort });
        panel.setSelectedSort(sortId);
      }
    });

    (function(window, undefined){
        var History = window.History;
        if ( !History.enabled ) return;

        History.Adapter.bind(window, 'statechange', function(){
          var state = History.getState();
          viewState.fromUrl(state.url);
        });
        viewState.fromUrl(History.getState().url);
    })(window);

    panel.on('select_group', function(group) {
      viewState.set({ filter: group.get('urlName') }, { silent: true });
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
  });
};