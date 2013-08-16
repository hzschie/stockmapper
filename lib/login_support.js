var dataDomain = process.env.DATA_DOMAIN;

var express = require('express'),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy;
    
module.exports = (function() {
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(str, done) {
    // console.log('DEserialize', str);
    done(null, { id: str });
  });
  
  // For now, strategy is hardcoded for Foreside purposes
  passport.use(new LocalStrategy(
    function(username, password, done) {
      if(password) {
        password = password.toLowerCase();
        if(['usa', '2n'].indexOf(password) > -1) {
          console.log('LOG IN: ' + password);
          done(null, { id: password });
        }
        else {
          console.log('FAILED ATTEMP: ' + password);
          done(null, false, { message: 'Invalid password' });
        }
      }
    }
  ));
  
  function login_support(app) {
    app.use('/', express.cookieParser());
    app.use('/', express.bodyParser());
    app.use('/', express.session({ secret: 'keyboard cat' }));
    app.use('/', passport.initialize());
    app.use('/', passport.session());
    
    app.get('/login', function(req, res) {
      res.render('domains/' + dataDomain + '/login', {
        analyticsCode: process.env.ANALYTICS_CODE
      });
    });

    app.post('/login',
      passport.authenticate('local', { failureRedirect: '/login' }),
      function(req, res) {
        res.redirect(req.session.redirect_to || '/');
      }
    );
  };
  
  login_support.ensureAuthenticated = function(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    req.session.redirect_to = req.url;
    res.redirect('/login');
  };
  
  return login_support;
})();