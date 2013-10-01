module.exports = function(app, loginSupport) {
  // var authenticate = loginSupport ? loginSupport.ensureAuthenticated : function(req, res, next) { next(); };
  // ['', 'partners', 'media', 'composite', 'etf50', 'etf25', 'etf25ne', 'etfmapper', 'stats'].forEach(function(pageId, i) {
  //   app.get('/' + (pageId ? pageId + '.html' : ''), authenticate, function(req, res) {
  //     res.render(
  //       'domains/foreside/' + (pageId || 'home'),
  //       {
  //         currentPage: pageId,
  //         groups: app.groups,
  //         stocks: app.stocks
  //       }
  //     );
  //   });
  // });
  // 
  // ['Quisque a feugiat est quis dictum', 'Curabitur elementum molestie', 'Phasellus nisi ipsum scelerisque id']
  // .map(function(headline) { return headline.toLowerCase().split(' ').join('-'); })
  // .forEach(
  //   function(url) {
  //     app.get('/media/' + url, authenticate, function(req, res) {
  //       res.render('domains/foreside/media/' + url, {currentPage: 'media'});
  //     });
  //   }
  // );
};