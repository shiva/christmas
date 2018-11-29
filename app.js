var express = require('express');
var routes = require('./routes');
var lists = require('./routes/lists');
var items = require('./routes/items');
var http = require('http');
var path = require('path');
var mongoskin = require('mongoskin');
var passport = require('passport');
var Auth0Strategy = require('passport-auth0');
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn();

var check_credentials = function () {
    if (!process.env.DB_USER || !process.env.DB_PASSWD ||
        !process.env.DB_HOST || !process.env.DB_PORT) {
            return false;
        }
    return true;
}

if (!check_credentials()) {
    console.error("Invalid Credentials. Cannot connect to DB. Exiting...\n");
    process.exit(1);
}
var db_uri = 'mongodb://' + process.env.DB_USER + ":" + process.env.DB_PASSWD
                + '@' + process.env.DB_HOST + ":" + process.env.DB_PORT
                + '/wishlists';

var db = mongoskin.db(db_uri, {safe:true});
var ObjectID = require('mongoskin').ObjectID;

if (!db) {
    console.error("Error connecting to DB. Exiting...\n");
    process.exit(1);
}
var app = express();
var router = express.Router();

app.locals.baseurl = path.normalize((process.env.BASEURL || '/') + '/');
console.log('baseurl=' , app.locals.baseurl);

var favicon = require('serve-favicon'),
  logger = require('morgan'),
  bodyParser = require('body-parser'),
  methodOverride = require('method-override'),
  cookieParser = require('cookie-parser'),
  session = require('express-session'),
  csrf = require('csurf'),
  errorHandler = require('errorhandler');

app.use(function(req, res, next) {
  req.db = {};
  req.db.wishlists = db.collection('christmas');
  next();
})
app.locals.appname = 'Wishlists'

var whatsapp_text =
  'Check out the wishlists app at http://shiv.me/wishlists' +
  ' -- a simple way to say what you want.';
app.locals.whatsapp_text = encodeURI(whatsapp_text);

app.locals.moment = require('moment');

app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(favicon(path.join('public','favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride());
app.use(cookieParser('CEAF3FA4-F385-49AA-8FE4-54766A9874F1'));
app.use(session({
  secret: '59B93087-78BC-4EB9-993A-A61FC844F6C9',
  resave: true,
  saveUninitialized: true
}));
app.use(csrf());

var strategy = new Auth0Strategy({
    domain: process.env.AUTH0_DOMAIN,
    clientID: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    callbackURL:
    process.env.AUTH0_CALLBACK_URL || 'http://localhost:3000/callback'
  },
  function(accessToken, refreshToken, extraParams, profile, done) {
    // accessToken is the token to call Auth0 API (not needed in the most cases)
    // extraParams.id_token has the JSON Web Token
    // profile has all the information from the user
    return done(null, profile);
  }
);

passport.use(strategy);

app.use(passport.initialize());
app.use(passport.session());

app.use(app.locals.baseurl, require('less-middleware')(path.join(__dirname, 'public')));
app.use(app.locals.baseurl, express.static(path.join(__dirname, 'public')));

app.use(function(req, res, next) {
  res.locals._csrf = req.csrfToken();
  return next();
})

app.get('*', function(req, res, next) {
  // put user into res.locals for easy access from templates
  res.locals.user = req.user || null;
  console.log("User: ", res.locals.user);
  next();
});

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});


String.prototype.capitalizeFirstLetter = function(allWords) {
  return this.charAt(0).toUpperCase() + this.slice(1);
}

router.param('list_id', function(req, res, next, listId) {
  req.db.wishlists.findById(listId, function(error, list) {
    if (error) return next(error);
    if (!list) return next(new Error('Cannot find list with id=' + listId));

    list.user = list.user.capitalizeFirstLetter();
    req.list = list;
    console.log('list=' + req.list);
    return next();
  });
});

router.param('item_id', function(req, res, next, itemId) {
  // for now, item index is the id. simply store this
  // in the req, since there is no way of uniquely identifying this
  // without a list_id
  req.item_id = itemId;
  return next();
});


router.get('/', routes.index);
router.get('/login', passport.authenticate('auth0', {
  scope: 'openid email profile'
}), (req, res) => {
    res.redirect("/dashboard");
});

router.get('/logout', (req, res)=>{
  // For the logout page, we don't need to render a page, we just want the user to be logged out when they hit this page. We'll use the ExpressJS built in logout method, and then we'll redirect the user back to the homepage.
  req.logout();
  res.redirect('/');
});

router.get('/callback', function (req, res, next) {
  passport.authenticate('auth0', function (err, user, info) {
    if (err) { return next(err); }
    if (!user) { return res.redirect('/login'); }
    req.logIn(user, function (err) {
      if (err) { return next(err); }
      const returnTo = req.session.returnTo;
      delete req.session.returnTo;
      res.redirect(returnTo || '/dashboard');
    });
  })(req, res, next);
});

router.get('/dashboard', ensureLoggedIn, routes.dashboard);
router.get('/credits', routes.credits);
router.get('/profile', routes.profile);
router.get('/list/:list_id', ensureLoggedIn, lists.get);
router.post('/list/:list_id/item/new', ensureLoggedIn, items.add);
router.get('/list/:list_id/item/:item_id/edit', ensureLoggedIn, items.edit);
router.post('/list/:list_id/item/:item_id/update', ensureLoggedIn, items.update);

router.all('*', function(req, res){
  res.status(404).send();
})

app.use(app.locals.baseurl, router);

// development only
if ('development' == app.get('env')) {
  app.use(errorHandler());
}

module.exports = app;
