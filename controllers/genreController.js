const Genre = require("../Models/genre");
const Book = require("../Models/book");
const async = require("async");

const { body, validationResult } = require("express-validator");
const genre = require("../Models/genre");


// Display list of all Genre.
exports.genre_list = (req, res) => {
  Genre.find()
  .sort([["name","ascending"]])
  .exec(function(err,list_genres){
    if(err){
      return next(err)
    }
    res.render("genre_list",{
      title: 'Genres',
      genre_list: list_genres
    })
  })
};

// Display detail page for a specific Genre.
exports.genre_detail = (req, res, next) => {
  async.parallel(
    {
      genre(callback) {
        Genre.findById(req.params.id).exec(callback);
      },

      genre_books(callback) {
        Book.find({ genre: req.params.id }).exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.genre == null) {
        // No results.
        const err = new Error("Genre not found");
        err.status = 404;
        return next(err);
      }
      // Successful, so render
      res.render("genre_detail", {
        title: "Genre Detail",
        genre: results.genre,
        genre_books: results.genre_books,
      });
    }
  );
};


// Display Genre create form on GET.
exports.genre_create_get = (req, res, next) => {
  res.render("genre_form", { title: "Create Genre" });
};


// Handle Genre create on POST.
exports.genre_create_post = [
  // Validate and sanitize the name field.
  body("name", "Genre name required").trim().isLength({ min: 1 }).escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a genre object with escaped and trimmed data.
    const genre = new Genre({ name: req.body.name });

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.render("genre_form", {
        title: "Create Genre",
        genre,
        errors: errors.array(),
      });
      return;
    } else {
      // Data from form is valid.
      // Check if Genre with same name already exists.
      Genre.findOne({ name: req.body.name }).exec((err, found_genre) => {
        if (err) {
          return next(err);
        }

        if (found_genre) {
          // Genre exists, redirect to its detail page.
          res.redirect(found_genre.url);
        } else {
          genre.save((err) => {
            if (err) {
              return next(err);
            }
            // Genre saved. Redirect to genre detail page.
            res.redirect(genre.url);
          });
        }
      });
    }
  },
];


// Display Genre delete form on GET.
exports.genre_delete_get = (req, res) => {
  async.parallel(
    {
      genre(callback) {
        Genre.findById(req.params.id).exec(callback);
      },
      genres_books(callback){
        Book.find({genre : req.params.id}).exec(callback)
      }
    },
    (err,results)=>{
      if(err){
        return next(err)
      }
      if(results.genre_books === null){
        res.redirect("/catalog/genres");
      }
      console.log(results.genre_books)
      res.render("genre_delete",{
        title: "Delete Genre",
        genre: results.genre,
        genre_books: results.genres_books,
      })
    }
  )
};

// Handle Genre delete on POST.
exports.genre_delete_post = (req, res) => {
  async.parallel(
    {
      genre(callback) {
        Genre.findById(req.params.id).exec(callback);
      },
      genres_books(callback){
        Book.find({genre : req.params.id}).exec(callback)
      }
    },
    (err,results)=>{
      if(err){
        return next(err)
      }
      
      if (results.genres_books.length > 0) {
        res.render("genre_delete", {
          title: "Delete Genre",
          genre: results.genre,
          genre_books: results.genres_books,
        });
        return;
      }

      //else
      Genre.findByIdAndRemove(req.body.genreid,(err)=>{
        if (err) {
          return next(err);
        }
        // Success - go to author list
        res.redirect("/catalog/genres");
      })
    }
  )
};

// Display Genre update form on GET.
exports.genre_update_get = (req, res) => {
  async.parallel(
    {
      genre(callback){
        Genre.findById(req.params.id).exec(callback)
      }
    },
    (err,results)=>{
      if(err){
        return next(err)
      }
      res.render("genre_form",{
        genre: results.genre
      })
    }
  )
};

// Handle Genre update on POST.
exports.genre_update_post = [
  body("name","Genre Name Must Be At Least 3 Letters Long")
    .trim()
    .isLength({min: 3})
    .escape(),

  (req,res,next)=>{
    const errors = validationResult(req);

    const genre = new Genre({
      _id: req.params.id,
      name: req.body.name
    })

      if(!errors.isEmpty()){
        async.parallel(
          {
            genre(callback){
              Genre.findById(req.params.id).exec(callback)
            }
          },
          (err,results)=>{
            if(err){
              return next(err)
            }
            res.render("genre_form",{
              title: "Update Genre",
              genre: results.genre,
              errors: errors.array()
            })
          }
        )
      }

    //else update genre
    Genre.findByIdAndUpdate(req.params.id, genre , {},(err,thegenre)=>{
      if(err){
        return next(err);
      }

      res.redirect(thegenre.url)
    })
  }
];
