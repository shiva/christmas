var validUrl = require('valid-url');

var sanitize = function (str){
    str = str.trim();
    if (str.length == 0)
        return null;
    return str;
}

exports.add = function(req, res, next){
  if (!req.body || !req.body.item_name) return next(new Error('No data provided.'));
  if (!req.list) return next(new Error('No such list.'));

  console.log("req.body=" + JSON.stringify(req.body, null, 4));
  console.log("req.list=" + JSON.stringify(req.list, null, 4));

  item = {};
  item.name = sanitize(req.body.item_name);
  if (item.name === null)
    return next(new Error('Invalid name provided.'))

  if (validUrl.isUri(req.body.item_link)) {
      item.link = req.body.item_link
  }

  if (req.body.item_notes) {
    item.notes = sanitize(req.body.item_notes)
  }

  req.db.wishlists.updateById(
      req.list._id,
      { $push: { items: item } },
      function(error, cursor) {
          if (error) return next(error);
          if (!cursor) return next(new Error('Failed to save.'));

          console.info('Added %s to list-id=%s', item.name, req.list._id);
          res.redirect('/' + req.list._id);
      }
  );
}

exports.edit = function(req, res, next) {

}

/*
exports.del = function(req, res, next) {
  req.db.wishlists.removeById(req.list._id, function(error, count) {
    if (error) return next(error);
    if (count !==1) return next(new Error('Something went wrong.'));
    console.info('Deleted list %s with id=%s completed.', req.list.name, req.list._id);
    res.status(204).send();
  });
};
*/
