const fs = require('fs');
const path = require('path');
const utils = require('../utils');

// set __dirname to the parent directory
__dirname = path.resolve(path.dirname(__dirname));

async function Get(req, res, next) {
    req.session.hasAccess = false;
    req.session.hasAccess = await utils.checkPerms(req.session.signedInRole, "users","G")
    if (req.session.hasAccess) {
        res.render('users');
    } else {
        console.log(`Unauthorized GET to '/users' from IP: ${req.ip}`)
        const error = new Error('User is not authorized to access this endpoint. This has been logged');
        error.status = 402;
        return next(error);
    }
}

async function Post(req, res, next) {
    req.session.hasAccess = false;
    req.session.hasAccess = await utils.checkPerms(req.session.signedInRole, "users","P")
    if (req.session.hasAccess) {
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
                    const csvData = `${username},${hashedPass},mod\n`;

                    fs.appendFile(__dirname + '/database/users.csv', csvData, (err) => {
                        if (err) {
                            console.error('Error writing to CSV:', err);
                            const error = new Error("Error submitting form. Please try again.");
                            error.status = 500;
                            return next(error);
                        } else {
                            utils.copyFile(`${__dirname}/clean-database/msg.csv`, `${__dirname}/database/${username}/msg.csv`,{ recursive: true }, (err) => {
                                if (err) {
                                    console.error('Error copying file:', err);
                                } else {
                                    console.log(`${csv2Get} deleted by User: ${req.session.signedInUser}`);
                                }
                            });
                            const error = new Error("User Successfully Created!");
                            error.status = 600;
                            return next(error);
                        }
                    })
                });
        }
    } else {
        console.log(`Unauthorized POST to '/users' from IP: ${req.ip}`)
        const error = new Error('User is not authorized to access this endpoint. This has been logged');
        error.status = 402;
        return next(error);
    }
}

async function Delete(req, res, next) {
    req.session.hasAccess = false;
    req.session.hasAccess = await utils.checkPerms(req.session.signedInRole, "users","D")
    if (req.session.hasAccess) {
        const rowIndex = req.query.index;
        let csvData = fs.readFileSync(__dirname + '/database/users.csv', 'utf8');
        let rows = csvData.split('\n');
        rows.splice(rowIndex, 1);
        csvData = rows.join('\n');

        fs.writeFileSync(__dirname + '/database/users.csv', csvData);
        res.sendStatus(200);
    } else {
        console.log(`Unauthorized DELETE to '/users' from IP ${req.ip}`)
        const error = new Error('User is not authorized to access this endpoint. This has been logged');
        error.status = 402;
        return next(error);
    }
}


module.exports = { Get, Post, Delete }