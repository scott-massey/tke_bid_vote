// config/passport.js
// Code adapted from https://github.com/manjeshpv/node-express-passport-mysql

// load all the things we need
let LocalStrategy = require("passport-local").Strategy;

// load up the user model
const mysql = require("mysql");
const bcrypt = require("bcryptjs");
const dbconfig = require("./database");
/*const connection = mysql.createPool(dbconfig.connection);
connection.query("USE " + dbconfig.database);*/
let connection = mysql.createConnection(dbconfig.connection);
connection.query("USE " + dbconfig.database);
function handle_mysql_disconnect(_connection){ // this arg should not be "connDB", otherwise you cannot redefine the global "connDB"
    _connection.on('error', function(error){
        if(!error.fatal)  return;
        if(error.code !== 'PROTOCOL_CONNECTION_LOST')  throw error;

        console.log("re-connecting with mysql server!");

        connection = mysql.createConnection(dbconfig.connection);
        connection.query("USE " + dbconfig.database);
        handle_mysql_disconnect(connection);
        connection.connect();
    });
}

handle_mysql_disconnect(connection);
// expose this function to our app using module.exports
module.exports = function (passport) {
  // =========================================================================
  // passport session setup ==================================================
  // =========================================================================
  // required for persistent login sessions
  // passport needs ability to serialize and unserialize users out of session

  // used to serialize the user for the session
  passport.serializeUser(function (user, done) {
    done(null, user.id);
  });

  // used to deserialize the user
  passport.deserializeUser(function (id, done) {
    connection.query("SELECT * FROM users WHERE id = ? ", [id], function (
      err,
      rows
    ) {
      done(err, rows[0]);
    });
  });

  // =========================================================================
  // LOCAL SIGNUP ============================================================
  // =========================================================================
  // we are using named strategies since we have one for login and one for signup
  // by default, if there was no name, it would just be called 'local'

  passport.use(
    "local-signup",
    new LocalStrategy(
      {
        // by default, local strategy uses username and password, we will override with email
        usernameField: "username",
        passwordField: "password",
        passReqToCallback: true, // allows us to pass back the entire request to the callback
      },
      function (req, username, password, done) {
        //input validation
        const regexUser = /^[ a-z1-9\-]{3,20}$/i;
        if(!regexUser.exec(username)){
          return done(
            null,
            false,
            req.flash("signupMessage", "Please make your username within 3-20 characters, using only letters, numbers, and hyphens."));
        }
        // regex taken from https://www.thepolyglotdeveloper.com/2015/05/use-regex-to-test-password-strength-in-javascript/
        const regexPass = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/
        if(!regexPass.exec(password)){
          return done(
            null,
            false,
            req.flash("signupMessage", "Please make your password 8 characters or longer, \
              contain at least 1 lowercase and uppercase letter, and contain one special character (!@#$%^&*)"));
        }

        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        connection.query(
          "SELECT * FROM users WHERE username = ?",
          [username],
          function (err, rows) {
            if (err) return done(err);
            if (rows.length) {
              return done(
                null,
                false,
                req.flash("signupMessage", "That username is already taken.")
              );
            } else {
              // if there is no user with that username
              // create the user

              let newUserMysql = {
                username,
                password
              };
              bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(newUserMysql.password, salt, (err, hash) => {
                  if(err) throw err;
                  newUserMysql.password = hash;
                  const insertQuery =
                    "INSERT INTO users ( username, password ) values (?,?)";
                  connection.query(
                    insertQuery,
                    [newUserMysql.username, newUserMysql.password],
                    function (err, rows) {
                      newUserMysql.id = rows.insertId;

                      return done(null, newUserMysql);
                    }
                  );
                });
              });
            }
          }
        );
      }
    )
  );

  // =========================================================================
  // LOCAL LOGIN =============================================================
  // =========================================================================
  // we are using named strategies since we have one for login and one for signup
  // by default, if there was no name, it would just be called 'local'

  passport.use(
    "local-login",
    new LocalStrategy(
      {
        // by default, local strategy uses username and password, we will override with email
        usernameField: "username",
        passwordField: "password",
        passReqToCallback: true, // allows us to pass back the entire request to the callback
      },
      function (req, username, password, done) {
        // callback with email and password from our form
        connection.query(
          "SELECT * FROM users WHERE username = ?",
          [username],
          function (err, rows) {
            if (err) return done(err);
            if (!rows.length) {
              return done(
                null,
                false,
                req.flash("loginMessage", "No user found.")
              ); // req.flash is the way to set flashdata using connect-flash
            }

            // if the user is found but the password is wrong
            bcrypt.compare(password, rows[0].password, (err, isMatch) => {
              if (err) throw err;
              if (isMatch) {
                return done(null, rows[0]);
              } else {
                return done(null, false, req.flash("loginMessage", "Password Incorrect."));
              }
            });
          }
        );
      }
    )
  );
};
