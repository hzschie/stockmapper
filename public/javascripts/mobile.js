mapper.Mobile = function() {};

mapper.Mobile.ready = function() {
  var layout = lll = new CardLayout($('.layout')),
      viewState = new mapper.ViewState({
        defaultSort: mapper.sortFunctions.sym,
        trackedParams: ['filter', 'sort', 'q', 'range', 'mobile']
      }),
      groupsView = new mapper.GroupsView($('.groups_view'), mapper.groups),
      map = new mapper.Map($('.map'));
      
  function updateView(force) {
    if(viewState.hasChanged('currentGroup') || force) {
      var currentGroup = viewState.get('currentGroup');
      if(currentGroup) {
        layout.setPage(1);
        map.setModels(currentGroup.get('members'));
      }
      else {
        layout.setPage(0);
      }
    }
  }
  
  updateView(true);
  viewState.on('change', function() { updateView(false); });
  
  groupsView.on('select_group', function(group) {
    viewState.set({ filter: group.get('urlName') }, { silent: true });
    History.pushState(null, null, viewState.toUrl());
  });
  
  function CardLayout($container, num) {
    var $current;
    $container.children().each(function(i) {
      $(this).css({
        position:'absolute',
        left: 0,
        right: 0,
        top:0,
        opacity:0
      });
    });
    $container.css({
      'min-height':'100%',
      overflow:'hidden'
    });
    
    this.setPage = function(num) {
      var $child = $container.children().eq(num);
      if($current && $current[0] == $child[0]) return;
      
      if($current) $current
        .removeClass('active')
        .animate({
            opacity:0
          }, {
          complete: function() {
            $(this).css({ position:'absolute' }).hide();
          }
        });
        
      $current = $child;
      
      if($current) $current
        .show()
        .removeClass('active')
        .animate({
            opacity:1
          }, {
          complete: function() {
            $(this).css({ position:'relative' });
          }
        });
    };
    
    if(num != null) this.setPage(num);
  }
};