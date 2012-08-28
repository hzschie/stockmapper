mapper.Mobile = function() {};

mapper.Mobile.ready = function() {
  var groupsView = new mapper.GroupsView($('.groups_view'), mapper.groups),
      viewState = new mapper.ViewState();
      
  // function updateView(force) {
  //   if(viewState.hasChanged('currentGroup') || force) {
  //     var currentGroup = viewState.get('currentGroup');
  //     map.setModels(currentGroup.get('members'));
  //     chart.setModels(currentGroup.get('members'));
  //     panel.setSelectedGroup(currentGroup);
  //     inspector.suspendTillDone(map);
  //   }
  // 
  //   if(viewState.hasChanged('currentSort') || force) {
  //     panel.setSelectedSort(viewState.get('currentSort').id);
  //   }
  // 
  //   if(viewState.hasChanged('currentStock') || force) {
  //     details.query(viewState.get('currentStock'));
  //   }
  // 
  //   if(viewState.hasChanged('range') || force) {
  //     details.setRange(viewState.get('range'));
  //   }
  // }
  // 
  // updateView(true);
  
  groupsView.on('select_group', function(group) {
    viewState.set({ filter: group.get('urlName') }, { silent: true });
    History.pushState(null, null, viewState.toUrl());
  });
};