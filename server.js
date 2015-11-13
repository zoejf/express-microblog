// require express and other modules
var express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    mongoose = require('mongoose'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    GithubStrategy = require('passport-github').Strategy,
    oauth = require('./oauth.js');

// configure bodyParser (for receiving form data)
app.use(bodyParser.urlencoded({ extended: true }));

// serve static files from public folder
app.use(express.static(__dirname + '/public'));

// set view engine to hbs (handlebars)
app.set('view engine', 'hbs');

// connect to mongodb
mongoose.connect('mongodb://localhost/microblog-app');

// require Post and User models
var Post = require('./models/post'),
    User = require('./models/user');

// middleware for auth
app.use(cookieParser());
app.use(session({
  secret: 'supersecretkey',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// passport config
passport.use(new LocalStrategy(User.authenticate()));
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

// passport-github config
passport.use(new GithubStrategy({
  clientID: oauth.github.clientID,
  clientSecret: oauth.github.clientSecret,
  callbackURL: oauth.github.callbackURL
}, function (accessToken, refreshToken, profile, done) {
  User.findOne({ oauthID: profile.id }, function (err, foundUser) {
    if (foundUser) {
      done(null, foundUser);
    } else {
      var newUser = new User({
        oauthID: profile.id,
        username: profile.username
      });
      newUser.save(function (err, savedUser) {
        console.log('saving user...');
        done(null, savedUser);
      });
    }
  });
}));

// serialize and deserialize
passport.serializeUser(function (user, done) {
  console.log('serializeUser:', user._id);
  done(null, user._id);
});
passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    console.log(user);
    done(null, user);
  });
});


// HOMEPAGE ROUTE

app.get('/', function (req, res) {
  res.render('index');
});


// AUTH ROUTES

// show signup view
app.get('/signup', function (req, res) {
  // if user is logged in, don't let them sign up again
  if (req.user) {
    res.redirect('/profile');
  } else {
    res.render('signup');
  }
});

// sign up new user, then log them in
// hashes and salts password, saves new user to db
app.post('/signup', function (req, res) {
  // if user is logged in, don't let them sign up again
  if (req.user) {
    res.redirect('/profile');
  } else {
    User.register(new User({ username: req.body.username }), req.body.password,
      function (err, newUser) {
        passport.authenticate('local')(req, res, function () {
          res.redirect('/profile');
        });
      }
    );
  }
});

// show login view
app.get('/login', function (req, res) {
  // if user is logged in, don't let them sign up again
  if (req.user) {
    res.redirect('/profile');
  } else {
    res.render('login');
  }
});

// log in user
app.post('/login', passport.authenticate('local'), function (req, res) {
  res.redirect('/profile');
});

// log out user
app.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/');
});

// show user profile page
app.get('/profile', function (req, res) {
  // only show profile if user is logged in
  if (req.user) {
    res.render('profile', { user: req.user });
  } else {
    res.redirect('/login');
  }
});

app.get('/auth/github', passport.authenticate('github'), function (req, res) {
  // the request will be redirected to github for authentication,
  // so this function will not be called
});

app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/login' }),
  function (req, res) {
    console.log(req.user);
    res.redirect('/profile');
  }
);


// API ROUTES

// get all posts
app.get('/api/posts', function (req, res) {
  // find all posts in db
  Post.find(function (err, allPosts) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ posts: allPosts });
    }
  });
});

// create new post
app.post('/api/posts', function (req, res) {
  // create new post with form data (`req.body`)
  var newPost = new Post(req.body);

  // save new post in db
  newPost.save(function (err, savedPost) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(savedPost);
    }
  });
});

// get one post
app.get('/api/posts/:id', function (req, res) {
  // get post id from url params (`req.params`)
  var postId = req.params.id;

  // find post in db by id
  Post.findOne({ _id: postId }, function (err, foundPost) {
    if (err) {
      if (err.name === "CastError") {
        this.status(404).json({ error: "Nothing found by this ID." });
      } else {
        this.status(500).json({ error: err.message });
      }
    } else {
      res.json(foundPost);
    }
  });
});

// update post
app.put('/api/posts/:id', function (req, res) {
  // get post id from url params (`req.params`)
  var postId = req.params.id;

  // find post in db by id
  Post.findOne({ _id: postId }, function (err, foundPost) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      // update the posts's attributes
      foundPost.title = req.body.title;
      foundPost.description = req.body.description;

      // save updated post in db
      foundPost.save(function (err, savedPost) {
        if (err) {
          res.status(500).json({ error: err.message });
        } else {
          res.json(savedPost);
        }
      });
    }
  });
});

// delete post
app.delete('/api/posts/:id', function (req, res) {
  // get post id from url params (`req.params`)
  var postId = req.params.id;

  // find post in db by id and remove
  Post.findOneAndRemove({ _id: postId }, function (err, deletedPost) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(deletedPost);
    }
  });
});


// listen on port 3000
app.listen(3000, function() {
  console.log('server started');
});