(function() {
  mapper.NewsTicker = function($container) {
    var $news = $container.find('.news'),
        news = new mapper.News($news),
        headlines = null,
        pos = null,
        intervalId = null;
        
    $container.click(function(e) {
      restart();
      incrementPos($(e.target).is('.down') ? 1 : -1);
    });
    $news.hover(stop, start);
    
    function incrementPos(increment) {
      setPos((pos + increment + headlines.length) % headlines.length);
    }
    
    function setPos(newPos) {
      // $news.children().addClass('current');return;
      if(pos !== null) {
        $news.children().eq(pos).removeClass('current');
      }
        
      pos = newPos;
      $news.children().eq(pos).addClass('current');
      scrollTo(40 * pos);
    }
    
    function stop() {
      if(intervalId !== null) {
        clearTimeout(intervalId);
        intervalId = null;
      }
    }
    
    function start() {
      if(intervalId === null) {
        intervalId = setInterval(function() {
          // Wrap in a d3 timer (which wraps requestAnimationFrame) in order to skip 
          // the animation if the browser tab is not in focus (at least theoretically)
          d3.timer(function() {
            incrementPos(1);
            return true;
          });
        }, 5000);
      }
    }
    
    function restart() {
      stop();
      start();
    }
    
    function scrollTo(y) {
      return $news.css('margin-top', -y);
      var $dummy = $('<div></div>');
      $dummy.css({ left:$news.scrollTop() });
      $dummy.animate(
        { left:y },
        {
          duration:650,
          step: function() {
            $news.scrollTop(parseInt($(this).css('left'), 10));
          },
          complete: function() {
            $news.scrollTop(y);
          },
          easing:'swing'
        }
      );
    }
        
    var instance = {
      setHeadlines: function(_headlines) {
        headlines = _headlines;
        news.render(headlines);
        setPos(0);
        start();
      }
    };
    
    return instance;
  };
})();