
exports.index = function(req, res) {
  console.log("deployed_loc: ", req.deployed_loc)
  return res.render('index', {
    title: 'Wishlists'
 });
}

exports.dashboard = function(req, res){
  req.db.wishlists.find().toArray(function(error, wishlists){
    if (error)
        return res.render('dashboard', {
          title: 'Our Christmas WishLists',
          wishlists: []
        });

    wishlists.sort(function(a, b){
      var a_name = a.user.toLowerCase()
      var b_name = b.user.toLowerCase()
      if(a_name < b_name) return -1;
      if(a_name > b_name) return 1;
      return 0;
    });

    res.render('dashboard', {
      title: 'Our Christmas WishLists',
      wishlists: wishlists || []
    });
  });
}

exports.profile = function(req, res) {
  res.render('profile', {
    title: 'Our Christmas WishLists'
  });
}

exports.credits = function(req, res) {
  res.render('credits', {
    title: 'Our Christmas WishLists'
  });
}
