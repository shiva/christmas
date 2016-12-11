var express = require('express');
var routes = require('./routes');
var lists = require('./routes/lists');
var items = require('./routes/items');
var http = require('http');
var path = require('path');
var mongoskin = require('mongoskin');

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

app.deployed_loc = path.normalize((process.env.BASEURL || '/') + '/');
console.log('deployed_location=' , app.deployed_loc);

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
  req.deployed_loc = app.deployed_loc;
  next();
})
app.locals.appname = 'Wishlists'

var whatsapp_text =
  'Check out <a href="shiv.me/wishlists/">Wishlists</a>' +
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

app.use(app.deployed_loc, require('less-middleware')(path.join(__dirname, 'public')));
app.use(app.deployed_loc, express.static(path.join(__dirname, 'public')));

app.use(function(req, res, next) {
  res.locals._csrf = req.csrfToken();
  return next();
})

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
router.get('/credits', routes.credits);
router.get('/list/:list_id', lists.get);
router.post('/list/:list_id/item/new', items.add);
router.get('/list/:list_id/item/:item_id/edit', items.edit);
router.post('/list/:list_id/item/:item_id/update', items.update);

router.all('*', function(req, res){
  res.status(404).send();
})

app.use(app.deployed_loc, router);

// development only
if ('development' == app.get('env')) {
  app.use(errorHandler());
}

module.exports = app;
