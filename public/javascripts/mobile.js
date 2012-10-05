mapper.Mobile = function() {};

mapper.Mobile.ready = function() {
  var layout = new CardLayout($('.layout')),
      viewState = new mapper.ViewState({
        defaultSort: mapper.sortFunctions.sym,
        trackedParams: ['filter', 'sort', 'q', 'range', 'mobile']
      }),
      groupsView = new mapper.GroupsView($('.groups_view'), mapper.groups),
      groupInfo = new mapper.GroupInfo($('.group_info')),
      sorts = new mapper.SelectorButtons($('.sorts'), function(id) { viewState.setState({ sort:id }); }),
      map = new mapper.Map($('.map ul')),
      details = new mapper.Details($('.details'));
      
  function updateView(force) {
    if(viewState.hasChanged('currentGroup') || force) {
      var currentGroup = viewState.get('currentGroup');
      groupsView.setSelected(currentGroup);
      if(currentGroup) {
        groupInfo.setGroup(currentGroup);
        map.setModels(currentGroup.get('members'));
        layout.setPage(viewState.get('currentStock') ? 2 : 1);
      }
      else {
        layout.setPage(viewState.get('currentStock') ? 2 : 0);
      }
    }
    
    if(viewState.hasChanged('currentSort') || force) {
      sorts.setCurrent(viewState.get('currentSort').id);
    }
    
    if(viewState.hasChanged('currentStock') || force) {
      var stock = viewState.get('currentStock');
      if(stock) {
        details.query(stock);
        layout.setPage(2);
      }
      else {
        layout.setPage(viewState.get('currentGroup') ? 1 : 0);
      }
    }
    
    if(viewState.hasChanged('range') || force) {
      details.setRange(viewState.get('range'));
    }
  }
  
  updateView(true);
  viewState.on('change', function() { updateView(false); });
  
  Interval.callOnce(function() {
    window.scrollTo(0,0);
  }, Interval.PRIORITY_FREETIME);
  
  groupsView.on('select_group', function(group) {
    viewState.setState({ filter: group.get('urlName') });
  });
  
  map.on('select_tag', function(model, $tag) {
    viewState.setState({ q: model.id });
  });
  
  details.on('select_range', function(range) {
    viewState.setState({ range: range });
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
      else $container.children().hide();
        
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