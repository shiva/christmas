exports.get = function(req, res, next){
  if (!req.list) return next(new Error('List is not found.'));
  res.render('list', {
    title: 'Our Christmas WishLists',
    baseurl: req.deployed_loc,
    list: req.list
  });
};

exports.add = function(req, res, next){
  if (!req.body || !req.body.name) return next(new Error('No data provided.'));
  req.db.wishlists.save({
    name: req.body.name,
    createTime: new Date()
  }, function(error, list){
    if (error) return next(error);
    if (!list) return next(new Error('Failed to save.'));
    console.info('Added %s with id=%s', list.name, list._id);
    res.redirect(req.deployed_loc);
  })
};
