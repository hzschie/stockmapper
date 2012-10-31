mapper.Mobile = function() {};

mapper.Mobile.ready = function() {
  var layout = new CardLayout($('.layout')),
      viewState = new mapper.ViewState({
        defaultSort: mapper.sortFunctions.chg,
        trackedParams: ['filter', 'sort', 'q', 'range', 'mobile']
      }),
      groupsView = new mapper.GroupsView($('.groups_view'), mapper.groups),
      groupInfo = new mapper.GroupInfo($('.group_info')),
      sorts = new mapper.SelectorButtons($('.sorts'), function(id) { viewState.setState({ sort:id }); }),
      map = new mapper.Map($('.map ul')),
      details = new mapper.Details($('.details')),
      
      $back = $('.app_header .back'),
      $window = $(window);
      
  $window.resize(function() {
    var w = $window.width();
    Interval.callOnce({
      key:'resize_map',
      fn:function() { map.resize(w); }
    }, Interval.PRIORITY_LOW);
    
    Interval.callOnce({
      key:'resize_stock_details',
      fn:function() { details.resize(w); }
    }, Interval.PRIORITY_LOW);
  });
  
      
  var GROUPS_PAGE = 0,
      MEMBERS_PAGE = 1,
      DETAILS_PAGE = 2;
      
  function updateView(force) {
    var pageNum = null;
    if(viewState.hasChanged('currentGroup') || force) {
      var currentGroup = viewState.get('currentGroup');
      groupsView.setSelected(currentGroup);
      if(currentGroup) {
        groupInfo.setGroup(currentGroup);
        map.setModels(currentGroup.get('members'));
        pageNum = viewState.get('currentStock') ? DETAILS_PAGE : MEMBERS_PAGE;
      }
      else {
        pageNum = viewState.get('currentStock') ? DETAILS_PAGE : GROUPS_PAGE;
      }
    }
    
    if(viewState.hasChanged('currentSort') || force) {
      sorts.setCurrent(viewState.get('currentSort').id);
    }
    
    if(viewState.hasChanged('currentStock') || force) {
      var stock = viewState.get('currentStock');
      map.search(stock);
      if(stock) {
        details.query(stock);
        pageNum = 2;
      }
      else {
        pageNum = viewState.get('currentGroup') ? MEMBERS_PAGE : GROUPS_PAGE;
      }
    }
    
    if(viewState.hasChanged('range') || force) {
      details.setRange(viewState.get('range'));
    }
    
    if(pageNum != null) {
      layout.setPage(pageNum);
      switch(pageNum) {
        case GROUPS_PAGE:
          $back.fadeOut();
          break;
        case MEMBERS_PAGE:
          $back.fadeIn().text('Groups');
          $back.off('click').click(function() { viewState.setState({ filter: null }); });
          break;
        case DETAILS_PAGE:
          $back.fadeIn().text('Stocks');
          $back.off('click').click(function() { viewState.setState({ q: null }); });
          break;
      }
    }
  }
  
  updateView(true);
  viewState.on('change', function() { updateView(false); });

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
      
      if($current) {
        $current
          .css({ position:'relative' })
          .show()
          .removeClass('active')
          .animate({
              opacity:1
            }, {
            complete: function() {
              //$(this).css({ position:'relative' });
            }
          });
        
        $(window).scrollTop(0);// Hides the address bar
      }
    };
    
    if(num != null) this.setPage(num);
  }
};