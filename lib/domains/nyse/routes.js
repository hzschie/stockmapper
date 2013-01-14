module.exports = function(app) {
  var prototypeHttpBase = "http://prototypes.stockmapper.com/";
  ['NYXtrac.html', 'NDXtrac.html', 'EURtrac3.html'].forEach(function(filename) {
    app.get('/' + filename, function(req, res) {
     res.redirect(prototypeHttpBase + filename);
    });
  });
};