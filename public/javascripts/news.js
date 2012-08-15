(function() {
  mapper.News = News;
  var Template = mapper.Template;
  News.bindings = [
    { $:'.title', field:'title' },
    { $:'.source', field:'source' },
    { $:'.date', field:'t', formatter:distanceOfTimeInWords }
  ];
  
  function News($news) {
    var template = new mapper.Template(),
        articleHtml = $('.article', $news).remove().wrap('<p>').parent().html();

    this.render = function(news) {
      console.log('render',news);
      $news.empty();
      $.each(news, function(i, article) {
        var $article = $(articleHtml).appendTo($news);
        template.applyBindings(News.bindings, $article, article);
      });
    };
    
    var velocity = 0;
    function mousemove(e) {
      // console.log(Object.keys(e));
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
  }
  
  var dateFormat = d3.time.format('%b %e, %Y');
  function distanceOfTimeInWords(fromTime, includeSeconds) {
    var distanceInSecondsRaw = Math.abs( Date.now() - Number(fromTime) ) / 1000;
    var distanceInSeconds = Math.round( distanceInSecondsRaw );
    var distanceInMinutes = Math.round( distanceInSecondsRaw / 60 );

    if(distanceInMinutes < 1) {
      return "less than 1 minute ago";
    }
    else if(distanceInMinutes <= 59) {
      return distanceInMinutes + " minute" + (distanceInMinutes == 1 ? "" : "s") + " ago";
    }
    else if(distanceInMinutes <= 1439) {
      var hrs = Math.floor(distanceInMinutes / 60.0);
      return hrs + " hour" + (hrs == 1 ? "" : "s") + " ago";
    }
    else {
      var days = Math.floor(distanceInMinutes / 1440.0);
      if(days == 1) return "yesterday";
      return dateFormat(new Date(fromTime));
    }
  };
})();