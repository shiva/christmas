
exports.get = function(req, res, next){
  console.log("list-id="+req.list._id);
  if (!req.list) return next(new Error('1. List is not found. id=' + req.list._id));
  res.render('list', {list: req.list});
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
    res.redirect('/');
  })
};

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
