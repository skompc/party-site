const fs = require('fs');
const path = require('path');
const utils = require('../utils');

// set __dirname to the parent directory
__dirname = path.resolve(path.dirname(__dirname));

async function Get(req, res, next) {
    req.session.hasAccess = false;
    req.session.hasAccess = await utils.checkPerms(req.session.signedInRole, "perms","G")
    if (req.session.hasAccess) {
        res.render('perms');
    } else {
        console.log(`Unauthorized GET to '/perms' from IP: ${req.ip}`)
        const error = new Error('User is not authorized to access this endpoint. This has been logged');
        error.status = 402;
        return next(error);
    }
}

async function Post(req, res, next) {
    req.session.hasAccess = false;
    req.session.hasAccess = await utils.checkPerms(req.session.signedInRole, "perms","P")
    if (req.session.hasAccess) {
        const updatedData = req.body;

        fs.readFile(__dirname + '/database/perms.csv', 'utf8', (err, data) => {
            if (err) {
                const error = new Error("Something seems to be wrong with reading from the submissions file. Please try again or contact admin");
                error.status = 504;
                return next(error);
            } else {


                // Split the existing data into rows
                const existingRows = data.trim().split('\n');

                // Take the first line of existing data and combine with updated data
                let newData = updatedData.trim().split('\n');

                // Filter out empty rows from the updated data
                newData = newData.filter(row => row.trim() !== '');

                // Append a comma to each line (except for the last line)
                const newContent = [existingRows[0], ...newData.map((line, index, array) => index === array.length ? line : line + ',')].join('\n') + '\n';


                fs.writeFile(__dirname + '/database/perms.csv', newContent, (err) => {
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
        console.log(`Unauthorized POST to '/perms' from IP: ${req.ip}`)
        const error = new Error('User is not authorized to access this endpoint. This has been logged');
        error.status = 402;
        return next(error);
    }
}

async function Delete(req, res, next) {
    req.session.hasAccess = false;
    req.session.hasAccess = await utils.checkPerms(req.session.signedInRole, "perms","D")
    if (req.session.hasAccess) {
        const rowIndex = req.query.index;
        let csvData = fs.readFileSync(__dirname + '/database/perms.csv', 'utf8');
        let rows = csvData.split('\n');
        rows.splice(rowIndex, 1);
        csvData = rows.join('\n');

        fs.writeFileSync(__dirname + '/database/perms.csv', csvData);
        res.sendStatus(200);
    } else {
        console.log(`Unauthorized DELETE to '/perms' from IP ${req.ip}`)
        const error = new Error('User is not authorized to access this endpoint. This has been logged');
        error.status = 402;
        return next(error);
    }
}


module.exports = { Get, Post, Delete }