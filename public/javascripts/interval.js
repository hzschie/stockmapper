(function() {
  /** This queue will execute first. All subscribers are guaranteed execution on every frame, even if doing so will result in violating MAX_FRAMETIME. */
  var PRIORITY_HIGH = 0,
  
  /** This queue will execute second. Subscribers won't be granted execution if MAX_FRAMETIME is violated. */
      PRIORITY_MID = 1,

  /** This queue will execute last. Subscribers won't be granted execution if MAX_FRAMETIME or AVG_FRAMETIME are violated. */
      PRIORITY_LOW = 2,
      
  /** This queue will execute only when there are no other active subscribers. */
      PRIORITY_FREETIME = 3,
      
      MAX_FRAMETIME = 60,
      AVG_FRAMETIME = 30;
  
  Interval = new IntervalService();
  Interval.HIGH = PRIORITY_HIGH;
  Interval.MID = PRIORITY_MID;
  Interval.LOW = PRIORITY_LOW;
  Interval.FREETIME = PRIORITY_FREETIME;
  
  function IntervalService() {
    var subscribersArray = [ [], [], [], [] ], // sub-arrays correspond to priorities
        subscribersTable = {},
        subscribersParamsTable = {},
        totalSubscribers = 0,// int

        isRunning = false,
        currentFrameStartTime,// Number
        executionsRemaining,// int

        lowPriorityExecutionArray,
        midPriorityExecutionArray,
        highPriorityExecutionArray,
        freeTimeExecutionArray,
        midPriorityResumePos = 0,// int
        lowPriorityResumePos = 0,// int
        freeTimeResumePos = 0,// int
    
        intervalId = null,
        uniqueId = 0,
        
        _this = this;
    
    // handler can be a function or an object like so { fn:handler threadId:'optional' }.
    // Normally, if add() is called multiple times with the same handler function, the function
    // only gets added once. This makes sense in many cases (like UI refresh callbacks). Internally,
    // to achieve this, Interval assigns a threadId to each callback in its system.
    // However, annonymous functions, which are declared (and re-declared) on the fly, can't retain 
    // threadIds; so there's no way for Interval to tell if an annonymous function is being
    // added multiple times. So, if you do need Interval to ensure that multiple add()'s of 
    // the same annonymous function don't get subscribed more than once, pass a consistent threadId
    // in here (or don't use an annoymous function. Sometimes though, such functions make it easy
    // to retain scope).
    this.add = function (handler, priority, params) {
      if(typeof(handler) != 'function') {
        var fn = handler.fn;
        fn.threadId = handler.threadId;
        handler = fn;
      }
      
      if(handler.threadId != null && subscribersTable[ handler.threadId ] != null) {
        return false;
      }
      
      if(handler.threadId == null) {
        handler.threadId = uniqueId++;
      }
      
      priority = priority == null ? PRIORITY_MID : priority;
      
      subscribersArray[priority].push(handler);
      subscribersTable[handler.threadId] = priority;
      subscribersParamsTable[handler.threadId] = params;
            
      totalSubscribers++;
      
      if (!isRunning) {
        startService();
      }
      
      return true;
    };

    this.callOnce = function (handler, priority, params) {
      if(typeof(handler) != 'function') {
        var fn = handler.fn;
        fn.threadId = handler.threadId;
        handler = fn;
      }

      var wrapper = function() {
        _this.remove(arguments.callee);// remove before calling handler, so that it can be resubscribed to during the call
        handler.apply(handler, arguments);
      };
      if(this.add({ fn:wrapper, threadId:handler.threadId }, priority, params)) {
        // store threadId that's assigned to wrapper so that we can track whether
        // callOnce() is being called again with same handler (which is not allowed).
        handler.threadId = wrapper.threadId;
        return true;
      }
      return false;
    };

    this.remove = function (handler) {
      if(subscribersTable[handler.threadId] == null) { return; }
      var destinationArray = subscribersArray[ subscribersTable[handler.threadId] ];
      destinationArray.splice( $.inArray(handler, destinationArray), 1 );
      totalSubscribers--;
      
      subscribersTable[handler.threadId] = null;
      
      if(totalSubscribers == 0) {
        stopService();
      }
    };

    function startService() {
      if(intervalId != null) { 
        throw new Error("Something is wrong: service is running when it's assumed to be stopped.");
      }
      isRunning = true;
      intervalId = setInterval(intervalHandler, AVG_FRAMETIME);
    }

    function stopService()
    {
      if(intervalId == null) { 
        throw new Error("Something is wrong: service is stopped when it's assumed to be running.");
      }
      isRunning = false;
      clearInterval(intervalId);
      intervalId = null;
    }

    function intervalHandler()
    {
      currentFrameStartTime = Date.now();
      
      var expectedNumOfExecutions = totalSubscribers - midPriorityResumePos - lowPriorityResumePos;
      executionsRemaining = expectedNumOfExecutions;
      
      highPriorityExecutionArray = subscribersArray[PRIORITY_HIGH].concat();
      $.each(highPriorityExecutionArray, function(i, handler) {
        call(handler);
        executionsRemaining--;
      });
      
      if(midPriorityResumePos == 0) {
        midPriorityExecutionArray = subscribersArray[PRIORITY_MID].concat();
      }
      for(var i = midPriorityResumePos; i < midPriorityExecutionArray.length; i++) {
        if(getCurrentFrameTime() < MAX_FRAMETIME) {
          call( midPriorityExecutionArray[i] );
          executionsRemaining--;
        }
        else {
          midPriorityResumePos = i;
          return;
        }
      }
      midPriorityResumePos = 0;
      
      if (lowPriorityResumePos == 0) {
        lowPriorityExecutionArray = subscribersArray[PRIORITY_LOW].concat();
      }
      for(i = lowPriorityResumePos; i < lowPriorityExecutionArray.length; i++) {
        if(getCurrentFrameTime() < AVG_FRAMETIME) {
          call(lowPriorityExecutionArray[i]);
          executionsRemaining--;
        }
        else {
          lowPriorityResumePos = i;
          return;
        }
      }
      lowPriorityResumePos = 0;
      
      if(midPriorityExecutionArray.length == 0 && lowPriorityExecutionArray.length == 0 && highPriorityExecutionArray.length == 0) {
        freeTimeExecutionArray = subscribersArray[PRIORITY_FREETIME].concat();
        for (i = 0; i < freeTimeExecutionArray.length; i++) {
          if(getCurrentFrameTime() < AVG_FRAMETIME) {
            call(freeTimeExecutionArray[i]);
          }
          else {
            freeTimeResumePos = i;
            return;
          }
        }
      }
    }
    
    function call(handler) {
      // if handler.success is false, it means the last time handler excecuted it an error was
      // thrown (so handler didn't get removed properly), so we unsubscribe to avoid a recurring errors
      if(handler.success === false) {
        _this.remove(handler);
        console.warn('Interval service removed a unsubsribed handler that threw an error.');
        return;
      }
      handler.success = false;
      handler.apply(handler, [getRemainingFrameTime() / executionsRemaining].concat( subscribersParamsTable[handler.threadId] ) );
      handler.success = true;
    }
    
    function getCurrentFrameTime() {
      return Date.now() - currentFrameStartTime;
    }
  
    function getRemainingFrameTime() {
      return AVG_FRAMETIME - (Date.now() - currentFrameStartTime);
    }
  }
})();
