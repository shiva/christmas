
exports.index = function(req, res){
  req.db.wishlists.find().toArray(function(error, wishlists){
    if (error)
        return res.render('index', { title: 'Wishlists' });

    wishlists.sort(function(a, b){
      var a_name = a.user.toLowerCase()
      var b_name = b.user.toLowerCase()
      if(a_name < b_name) return -1;
      if(a_name > b_name) return 1;
      return 0;
    });

    res.render('index', {
      title: 'Our Christmas WishLists',
      baseurl: req.deployed_loc,
      wishlists: wishlists || []
    });
  });
};

exports.credits = function(req, res) {
  res.render('credits', {
    title: 'Our Christmas WishLists',
    baseurl: req.deployed_loc
  });
}
