const fs = require('fs');
const path = require('path');
const utils = require('../utils');

// set __dirname to the parent directory
__dirname = path.resolve(path.dirname(__dirname));

async function Get(req, res, next) {
    req.session.hasAccess = false;
    req.session.hasAccess = await utils.checkPerms(req.session.signedInRole, "logs","G")
    if (req.session.hasAccess) {
        res.render('logs');
    } else {
        console.log(`Unauthorized GET to '/logs' from IP: ${req.ip}`)
        const error = new Error('User is not authorized to access this endpoint. This has been logged');
        error.status = 402;
        return next(error);
    }
}

async function Post(req, res, next) {
    req.session.hasAccess = false;
    req.session.hasAccess = await utils.checkPerms(req.session.signedInRole, "logs","P")
    if (req.session.hasAccess) {
        const updatedData = req.body;

        fs.readFile(__dirname + '/database/logs.csv', 'utf8', (err, data) => {
            if (err) {
                const error = new Error("Something seems to be wrong with reading from the log file. Please try again or contact admin");
                error.status = 504;
                return next(error);
            } else {
                const existingRows = data.split('\n');
                const newData = updatedData.split('\n');

                // Combine existing and new rows, filter out existing rows, and rejoin
                const combinedRows = existingRows
                    .concat(newData)
                    .filter((row, index, self) => index === self.indexOf(row) && row.trim() !== '')
                    .join('\n') + '\n';

                fs.writeFile(__dirname + '/database/logs.csv', combinedRows, (err) => {
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
        console.log(`Unauthorized POST to '/logs' from IP: ${req.ip}`)
        const error = new Error('User is not authorized to access this endpoint. This has been logged');
        error.status = 402;
        return next(error);
    }
}

async function Delete(req, res, next) {
    req.session.hasAccess = false;
    req.session.hasAccess = await utils.checkPerms(req.session.signedInRole, "logs","D")
    if (req.session.hasAccess) {
        const rowIndex = req.query.index;
        let csvData = fs.readFileSync(__dirname + '/database/logs.csv', 'utf8');
        let rows = csvData.split('\n');
        rows.splice(rowIndex, 1);
        csvData = rows.join('\n');

        fs.writeFileSync(__dirname + '/database/logs.csv', csvData);
        res.sendStatus(200);
    } else {
        console.log(`Unauthorized DELETE to '/logs' from IP ${req.ip}`)
        const error = new Error('User is not authorized to access this endpoint. This has been logged');
        error.status = 402;
        return next(error);
    }
}


module.exports = { Get, Post, Delete }