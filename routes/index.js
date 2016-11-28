
exports.index = function(req, res){
  req.db.wishlists.find().toArray(function(error, wishlists){
    if (error)
        return res.render('index', { title: 'Wishlists' });

    res.render('index', {
      title: 'Wish Lists',
      wishlists: wishlists || []
    });
  });
};

