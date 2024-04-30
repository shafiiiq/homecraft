var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var fileUpload = require('express-fileupload')
var session = require('express-session');

var indexRouter = require('./routes/index');
var clientRouter = require('./routes/client');
var contractorRouter = require('./routes/contractor');
var adminRouter = require('./routes/admin');


var clientDB = require('./db/client-db');
var contractorDB = require('./db/contractor-db');
var adminDB = require('./db/admin-db');
var chatDB = require('./db/chat-db');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
//app.use(fileUpload()); //here is the error note that

console.log('Before session middleware');
// session
app.use(session({ secret: "key", cookie: { maxAge: 60000000000 }, resave: true, saveUninitialized: true }));
console.log('After session middleware');

// client database
clientDB.connect((err) => {
  if(err) {
    console.log("Database connected successfully");
  }else {
    console.log("Connection error" +err);
  }
})

// contractor database
contractorDB.connect((err) => {
  if(err) {
    console.log("Database connected successfully");
  }else {
    console.log("Connection error" +err);
  }
})

// admin database
adminDB.connect((err) => {
  if(err) {
    console.log("Database connected successfully");
  }else {
    console.log("Connection error" +err);
  }
})

// chat database
chatDB.connect((err) => {
  if(err) {
    console.log("Database connected successfully");
  }else {
    console.log("Connection error" +err);
  }
})

app.use('/', indexRouter);
app.use('/client', clientRouter);
app.use('/contractor', contractorRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
