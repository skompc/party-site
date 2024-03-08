const fs = require('fs');
const path = require('path');
const utils = require('../utils');

// set __dirname to the parent directory
__dirname = path.resolve(path.dirname(__dirname));

async function Get(req, res, next) {
  if (req.session.authenticated) {
    const signedInUser = req.session.signedInUser
    res.render(`roles/${req.session.signedInRole}`, { signedInUser })
  } else {
    res.render('login');
  }
}

async function Post(req, res, next) {
  try {
    let { username, password } = req.body;

    username = username.replace(/[\r\n]+/g, '').replace(/,/g, ' # ');
    password = password.replace(/[\r\n]+/g, '').replace(/,/g, ' # ');

    const data = await fs.promises.readFile('database/users.csv', 'utf8');
    const lines = data.trim().split('\n');

    let loginSuccess = false;

    for (const line of lines) {
      const [usernameCSV, hashedPassword, role] = line.trim().split(',');
      if (hashedPassword != "Username") {
        const isUserMatch = eval(username === usernameCSV)
        const isPassMatch = await utils.checkHash(password, hashedPassword);

        if (isUserMatch && isPassMatch) {
          // User has successfully logged in
          console.log(`User: ${username} has logged in from IP: ${req.ip}!`);
          req.session.authenticated = true; // Set authentication status in session
          req.session.signedInRole = role;  // Set role
          req.session.signedInUser = username;
          loginSuccess = true;
          break; // Exit loop upon successful login
        }
      }
    }

    if (loginSuccess) {
      const signedInUser = req.session.signedInUser
      res.render(__dirname + `/pages/roles/${req.session.signedInRole}`, { signedInUser })
    } else {
      console.log(`User: ${req.body.username} HAS FAILED TO LOGIN from IP: ${req.ip}!`);
      const error = new Error('Failed login attempt. This has been logged.');
      error.status = 401;
      return next(error);
    }
  } catch (error) {
    console.error('Error reading file:', error);
    next(error);
  }
}

async function Delete(req, res, next) { }


module.exports = { Get, Post, Delete }