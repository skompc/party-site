const fs = require('fs');
const util = require('util');
const path = require('path');
const http = require('http');
const https = require('https');
const bodyParser = require('body-parser');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const app = express();

const utils = require('./utils')
const dashboard = require('./endpoints/dashboard')
const submissions = require('./endpoints/submissions')
const users = require('./endpoints/users')
const csv = require('./endpoints/csv')
const perms = require('./endpoints/perms');
const logs = require('./endpoints/logs');
const msg = require('./endpoints/msg')
const apply = require('./endpoints/apply')
const applications = require('./endpoints/applications')

let signedInUser = "";
let signedInRole = "";
let authenticated = false;
let hasAccess = false;

// Set logfile
const logFileStream = fs.createWriteStream(path.join(__dirname, 'database/logs.txt'), { flags: 'a' });

// Backup original log function
const originalConsoleLog = console.log;

// Override console.log to write to the file and also log to the original console
console.log = function (...args) {
  const logMessage = util.format(...args);

  // Write to the log file
  logFileStream.write(`${new Date().toISOString()} - ${logMessage}\n`);

  // Log to the original console
  originalConsoleLog.apply(console, args);

  const d_t = new Date();

  let year = d_t.getFullYear();
  let month = ("0" + (d_t.getMonth() + 1)).slice(-2);
  let day = ("0" + d_t.getDate()).slice(-2);
  let hour = d_t.getHours();
  let minute = d_t.getMinutes();
  let seconds = d_t.getSeconds();

  utils.logCSV(year, month, day, hour, minute, seconds, logMessage)
};

app.set('view engine', 'ejs');
app.set('views', 'pages');

app.use(express.static('./public'));
app.use(bodyParser.text({ type: 'text/csv' }));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: '1vPkcD3GfRTcbqpO3bzPmHVV5J6IsFHtR4caZvT5thkjwNYOsFbMvG6lMOearcPtjZnRIsky67AZpuiUm96LMRUoig4gG1EMUlWUhq6ijp2YY1hripPyeNEPoXQ1BSHzyzGTvcAJ1d2RwJmlqMYOWsFY2I3tEdPMqUWfBd6dWndab17SCUf0EraUtoMJBFLLBUBz5C47swTZT1YdU9dLNabc6zKYZCffcJKdzbelW4na8JviNBma5IEm6vrF9heioODzFRn7udCOCVA3Uma2ofE98YdCep4VN4GuFBQ5Kgk6ANB431SlkySqCrGcg5S2',
  resave: false,
  saveUninitialized: true,
}));

// Home Page
app.get('/', (req, res) => {
  res.render('index');
});


app.get("/dashboard", (req, res, next) => dashboard.Get(req, res, next));
app.post("/dashboard", (req, res, next) => dashboard.Post(req, res, next));

app.get("/submissions", (req, res, next) => submissions.Get(req, res, next));
app.post("/submissions", (req, res, next) => submissions.Post(req, res, next));
app.delete("/submissions", (req, res, next) => submissions.Delete(req, res, next));

app.get("/users", (req, res, next) => users.Get(req, res, next));
app.post("/users", (req, res, next) => users.Post(req, res, next));
app.delete("/users", (req, res, next) => users.Delete(req, res, next));

app.get("/perms", (req, res, next) => perms.Get(req, res, next));
app.post("/perms", (req, res, next) => perms.Post(req, res, next));
app.delete("/perms", (req, res, next) => perms.Delete(req, res, next));

app.get("/logs", (req, res, next) => logs.Get(req, res, next));
app.post("/logs", (req, res, next) => logs.Post(req, res, next));
app.delete("/logs", (req, res, next) => logs.Delete(req, res, next));

app.get("/csv", (req, res, next) => csv.Get(req, res, next));
app.post("/csv", (req, res, next) => csv.Post(req, res, next));
app.delete("/csv", (req, res, next) => csv.Delete(req, res, next))

app.get("/msg", (req, res, next) => msg.Get(req, res, next));
app.post("/msg", (req, res, next) => msg.Post(req, req, next));
app.delete("/msg", (req, res, next) => msg.Delete(req, req, next));

app.get("/apply", (req, res, next) => apply.Get(req, res, next));
app.post("/apply", (req, res, next) => apply.Post(req, req, next));
app.delete("/apply", (req, res, next) => apply.Delete(req, req, next));

app.get("/applications", (req, res, next) => applications.Get(req, res, next));
app.post("/applications", (req, res, next) => applications.Post(req, req, next));
app.delete("/applications", (req, res, next) => applications.Delete(req, req, next));

// Logout
app.get('/logout', (req, res, next) => {
  const user2logout = req.session.signedInUser;
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
    } else {
      console.log(`${user2logout} has logged out from ${req.ip}!`)
      res.redirect('/'); // Redirect to the home page after logout
    }
  });
});

// Home page submit
app.post('/submit-form', (req, res, next) => {
  let { name, email, phone, time, message } = req.body;

  name = name.replace(/[\r\n]+/g, ' # ').replace(/,/g, ' * ');
  email = email.replace(/[\r\n]+/g, ' # ').replace(/,/g, ' * ');
  phone = phone.replace(/[\r\n]+/g, ' # ').replace(/,/g, ' * ');
  time = time.replace(/[\r\n]+/g, ' # ').replace(/,/g, ' * ');
  message = message.replace(/[\r\n]+/g, ' # ').replace(/,/g, ' * ');

  let isEmail = utils.isEmailAddress(email);
  let isPhone = utils.isPhoneNumber(phone);

  if (!isEmail) {
    const error = new Error('Email is invalid');
    error.status = 502;
    return next(error);
  } else if (!isPhone) {
    const error = new Error('Phone number is invalid');
    error.status = 503;
    return next(error);
  } else {

    // Create a CSV string from the form data
    const csvData = `NEW,${name},${email},${phone},${time},${message}\n`;

    // Append data to a CSV file or create a new file if it doesn't exist
    fs.appendFile('database/submissions.csv', csvData, (err) => {
      if (err) {
        console.error('Error writing to CSV:', err);
        const error = new Error("Error submitting form. Please try again.");
        error.status = 500;
        return next(error);
      } else {
        const error = new Error("Form Successfully Submitted! We will contact you soon!");
        error.status = 600;
        return next(error);
      }
    });
  }
});

app.get('/userCreate', (req, res, next) => {
  res.render('newUser.ejs');
})

app.post('/userCreate', (req, res, next) => {
  let { username, password, password2 } = req.body;

  username = username.replace(/[\r\n]+/g, '').replace(/,/g, ' # ');
  password = password.replace(/[\r\n]+/g, '').replace(/,/g, ' # ');
  password2 = password2.replace(/[\r\n]+/g, '').replace(/,/g, ' # ');

  if (password != password2) {
    const error = new Error('Passwords do not match!');
    error.status = 402;
    return next(error);
  } else {
    let hashedPass;

    const hashPromises = [
      utils.hash(password).then((hashed) => {
        hashedPass = hashed;
      })
    ];

    Promise.all(hashPromises)
      .then(() => {
        // Create a CSV string from the form data
        const csvData = `${username},${hashedPass},applicant\n`;

        fs.appendFile(__dirname + '/database/users.csv', csvData, (err) => {
          if (err) {
            console.error('Error writing to CSV:', err);
            const error = new Error("Error submitting form. Please try again.");
            error.status = 500;
            return next(error);
          } else {
            utils.copyFile(`${__dirname}/clean-database/msg.csv`, `${__dirname}/database/${username}/msg.csv`, { recursive: true }, (err) => {
              if (err) {
                console.error('Error copying file:', err);
              }
            });
            const error = new Error("User Successfully Created!");
            error.status = 601;
            return next(error);
          }
        })
      });
  }
})

// Error Handler
app.use((err, req, res, next) => {
  if (err) {
    if (err.status == 600) {
      const successMessage = err.message;
      res.render('success', { successMessage });
    } else if (err.status == 601) {
      const successMessage = err.message;
      res.render('successToHome', { successMessage });
    } else {
      const errorMessage = err.message || '500 Internal Server Error';
      res.status(err.status || 500);
      res.render('error', { errorMessage });
    }
  } else {
    next();
  }
});

// HTTP server redirect to HTTPS
const httpServer = http.createServer((req, res) => {
  res.writeHead(301, { Location: `https://${req.headers.host}${req.url}` });
  res.end();
});

// Start HTTP server on port 80
const HTTP_PORT = 80;
httpServer.listen(HTTP_PORT, () => {
  console.log(`HTTP server running on port ${HTTP_PORT}`);
});

// HTTPS keys
const options = {
  key: fs.readFileSync('./keys/private.pem'), // Path to private key
  cert: fs.readFileSync('./keys/fullchain.pem'), // Path to certificate
};

// HTTPS server creation
const HTTPS_PORT = 443;
const server = https.createServer(options, app);

// Start HTTPS server on port 443
server.listen(HTTPS_PORT, () => {
  console.log(`HTTPS server started on port ${HTTPS_PORT}`);
});

// Make sure to close the logfile on application exit
process.on('exit', () => {
  logFileStream.end();
});
