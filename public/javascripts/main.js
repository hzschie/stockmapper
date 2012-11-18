// Initialize view and Historty
mapper.dataReady = function() {
  init = mapper.config.init;
  // Init views on document ready
  $(mapper.isMobile ? mapper.Mobile.ready : function() {
    init ? init() : mapper.Surface.init();
  });
};