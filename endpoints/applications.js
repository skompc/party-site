const fs = require('fs');
const path = require('path');
const utils = require('../utils');

// set __dirname to the parent directory
__dirname = path.resolve(path.dirname(__dirname));

async function Get(req, res, next) {
    const signedInUser = req.session.signedInUser
    req.session.hasAccess = false;
    req.session.hasAccess = await utils.checkPerms(req.session.signedInRole, "applications","G")
    if (req.session.hasAccess) {
        res.render('applications', { signedInUser });
    } else {
        console.log(`Unauthorized GET to '/applications' from IP: ${req.ip}`)
        const error = new Error('User is not authorized to access this endpoint. This has been logged');
        error.status = 402;
        return next(error);
    }
}

async function Post(req, res, next) {
    req.session.hasAccess = false;
    req.session.hasAccess = await utils.checkPerms(req.session.signedInRole, "applications","P")
    if (req.session.hasAccess) {
        const updatedData = req.body;

        fs.readFile(__dirname + '/database/applications.csv', 'utf8', (err, data) => {
            if (err) {
                const error = new Error("Something seems to be wrong with reading from the submissions file. Please try again or contact admin");
                error.status = 504;
                return next(error);
            } else {
                const headerRow = ",New?,Username,Name,Email,Phone,Address,City,State,Zip,Status\n"
                const newData = headerRow + updatedData.split('\n')
                .filter((row, index, self) => index === self.indexOf(row) && row.trim() !== '')
                .join('\n') + '\n';


                fs.writeFile(__dirname + '/database/applications.csv', newData, (err) => {
                    if (err) {
                        const error = new Error("Something seems to be wrong with  writing to the submissions file. Please try again or contact admin");
                        error.status = 505;
                        return next(error);
                    } else {
                        const error = new Error("Form updated successfully!");
                        error.status = 600;
                        return next(error);
                    }
                });
            }
        });
    } else {
        console.log(`Unauthorized POST to '/applications' from IP: ${req.ip}`)
        const error = new Error('User is not authorized to access this endpoint. This has been logged');
        error.status = 402;
        return next(error);
    }
}

async function Delete(req, res, next) {
    req.session.hasAccess = false;
    req.session.hasAccess = await utils.checkPerms(req.session.signedInRole, "applications","D")
    if (req.session.hasAccess) {
        const rowIndex = req.query.index;
        let csvData = fs.readFileSync(__dirname + '/database/applications.csv', 'utf8');
        let rows = csvData.split('\n');
        rows.splice(rowIndex, 1);
        csvData = rows.join('\n');

        fs.writeFileSync(__dirname + '/database/applications.csv', csvData);
    } else {
        console.log(`Unauthorized DELETE to '/applications' from IP ${req.ip}`)
        const error = new Error('User is not authorized to access this endpoint. This has been logged');
        error.status = 402;
        return next(error);
    }
}


module.exports = { Get, Post, Delete }