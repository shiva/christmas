var validUrl = require('valid-url');

var sanitize = function (str){
    str = str.trim();
    if (str.length == 0)
        return null;
    return str;
}

var makeItem = function (name, link, notes) {
  item = {};

  item.name = sanitize(name);
  if (item.name === null) {
    return null;
  }

  if (validUrl.isUri(link)) {
      item.link = link;
  }

  if (notes) {
    item.notes = sanitize(notes);
  }

  return item;
}

exports.add = function(req, res, next){
  if (!req.body || !req.body.item_name) return next(new Error('No data provided.'));
  if (!req.list) return next(new Error('No such list.'));

  item = makeItem(req.body.item_name, req.body.item_link, req.body.item_notes);
  if (!item) {
    return next(new Error('Cannot create item. Invalid name provided.'));
  }

  req.db.wishlists.updateById(
      req.list._id,
      { $push: { items: item } },
      function(error, cursor) {
          if (error) return next(error);
          if (!cursor) return next(new Error('Failed to save.'));

          console.info('Added %s to list-id=%s', item.name, req.list._id);
          res.redirect('..');
      }
  );
}

exports.edit = function(req, res, next) {
  item = req.list.items[req.item_id];
  item.idx =  req.item_id;

  res.render('item', {
    title: 'Our Christmas WishLists',
    baseurl: req.deployed_loc,
    list_id: req.list._id,
    item: item
  });
}

exports.update = function(req, res, next){
  if (!req.body || !req.body.item_name) return next(new Error('No data provided.'));
  if (!req.list) return next(new Error('No such list.'));

  item = makeItem(req.body.item_name, req.body.item_link, req.body.item_notes);
  if (!item) {
    return next(new Error('Cannot update item. Invalid name provided.'));
  }

  set = {};
  set['items.' + req.item_id] = item;

  req.db.wishlists.updateById(
      req.list._id,
      { $set: set },
      function(error, cursor) {
          if (error) return next(error);
          if (!cursor) return next(new Error('Failed to save.'));

          console.info('Updated %s to list-id=%s at index %d', item.name, req.list._id, req.item_id);
          res.redirect('../..');
      }
  );
}
