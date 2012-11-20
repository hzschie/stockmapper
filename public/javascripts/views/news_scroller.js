(function() {
  mapper.NewsScroller = function($news) {
    var instance = new mapper.News($news);

    var velocity = 0;
    function mousemove(e) {
      var h = $news.height(),
          y = e.pageY - $news.offset().top,
          f = (y/h - .5) * 2;
      
      velocity = Math.floor( 16 * Math.pow(f,2) * Math.abs(f) / f );
    }
    
    function updateScroll() {
      $news.scrollTop( $news.scrollTop() + velocity);
    }
    
    $news.hover(
      function() {
        $news.on('mousemove', mousemove);
        Interval.add(updateScroll, Interval.HIGH);
      },
      function() {
        $news.off('mousemove', mousemove);
        Interval.remove(updateScroll);
      }
    );
        
    return instance;
  };
})();