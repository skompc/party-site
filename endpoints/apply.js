const fs = require('fs');
const path = require('path');
const utils = require('../utils');

// set __dirname to the parent directory
__dirname = path.resolve(path.dirname(__dirname));

async function Get(req, res, next) {
    req.session.hasAccess = false;
    req.session.hasAccess = await utils.checkPerms(req.session.signedInRole, "apply", "G")
    if (req.session.hasAccess) {
        res.render('apply');
    } else {
        console.log(`Unauthorized GET to '/apply' from IP: ${req.ip}`)
        const error = new Error('User is not authorized to access this endpoint. This has been logged');
        error.status = 402;
        return next(error);
    }
}

async function Post(req, res, next) {
    req.session.hasAccess = false;
    req.session.hasAccess = await utils.checkPerms(req.session.signedInRole, "apply", "P")
    if (req.session.hasAccess) {
        let { name, street, city, email, phone, zip } = req.body;

        name = name.replace(/[\r\n]+/g, '').replace(/,/g, ' # ');
        street = street.replace(/[\r\n]+/g, '').replace(/,/g, ' # ');
        city = city.replace(/[\r\n]+/g, '').replace(/,/g, ' # ');
        email = email.replace(/[\r\n]+/g, '').replace(/,/g, ' # ');
        phone = phone.replace(/[\r\n]+/g, '').replace(/,/g, ' # ');
        zip = zip.replace(/[\r\n]+/g, '').replace(/,/g, ' # ');

        let isEmail = utils.isEmailAddress(email);
        let isPhone = utils.isPhoneNumber(phone);
        let isZip = utils.isZipCode(zip)

        if (!isEmail) {
            const error = new Error('Email is invalid');
            error.status = 502;
            return next(error);
        } else if (!isPhone) {
            const error = new Error('Phone number is invalid');
            error.status = 503;
            return next(error);
        } else if (!isZip) {
            const error = new Error('Zip Code is invalid');
            error.status = 503;
            return next(error);
        } else {

            // Create a CSV string from the form data
            const csvData = `NEW,${req.session.signedInUser},${name},${email},${phone},${street},${city},TX,${zip},Pending\n`;

            // Append data to a CSV file or create a new file if it doesn't exist
            fs.appendFile('database/applications.csv', csvData, (err) => {
                if (err) {
                    console.error('Error writing to CSV:', err);
                    const error = new Error("Error submitting form. Please try again.");
                    error.status = 500;
                    return next(error);
                } else {
                    const error = new Error("Form Successfully Submitted! We will contact you soon!");
                    error.status = 601;
                    return next(error);
                }
            });
        }

    } else {
        console.log(`Unauthorized POST to '/apply' from IP: ${req.ip}`)
        const error = new Error('User is not authorized to access this endpoint. This has been logged');
        error.status = 402;
        return next(error);
    }
}

async function Delete(req, res, next) {
    req.session.hasAccess = false;
    req.session.hasAccess = await utils.checkPerms(req.session.signedInRole, "apply", "D")
    if (req.session.hasAccess) {
        const rowIndex = req.query.index;
        let csvData = fs.readFileSync(__dirname + '/database/applications.csv', 'utf8');
        let rows = csvData.split('\n');
        rows.splice(rowIndex, 1);
        csvData = rows.join('\n');

        fs.writeFileSync(__dirname + '/database/applications.csv', csvData);
        res.sendStatus(200);
    } else {
        console.log(`Unauthorized DELETE to '/apply' from IP ${req.ip}`)
        const error = new Error('User is not authorized to access this endpoint. This has been logged');
        error.status = 402;
        return next(error);
    }
}

module.exports = { Get, Post, Delete }