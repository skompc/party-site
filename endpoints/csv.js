const fs = require('fs');
const path = require('path');
const multer = require('multer')
const utils = require('../utils');

// set __dirname to the parent directory
__dirname = path.resolve(path.dirname(__dirname));

async function Get(req, res, next) {
    req.session.hasAccess = false;
    const csv2Get = req.query.data;
    req.session.hasAccess = await utils.checkPerms(req.session.signedInRole, `${csv2Get}`, "G")
    if (csv2Get.startsWith(`${req.session.signedInUser}/`)) {
        req.session.hasAccess = true;
    }
    if (req.session.hasAccess) {
        res.sendFile(__dirname + `/database/${csv2Get}.csv`);
    } else {
        console.log(`Unauthorized GET to '/csv' from IP: ${req.ip}`)
        const error = new Error('User is not authorized to access this endpoint. This has been logged');
        error.status = 402;
        return next(error);
    }
}

async function Post(req, res, next) {

    req.session.hasAccess = false;
    const csv2Get = req.query.data;
    req.session.hasAccess = await utils.checkPerms(req.session.signedInRole, `${csv2Get}`, "P")

    if (csv2Get.startsWith(`${req.session.signedInUser}/`)) {
        req.session.hasAccess = true;
    }

    if (req.session.hasAccess) {

        // Set storage engine for Multer
        const storage = multer.diskStorage({
            destination: `${__dirname}/database/`,
            filename: function (req, file, cb) {
                cb(null, `${csv2Get}.csv`);
            }
        });

        // Initialize Multer upload
        const upload = multer({
            storage: storage,
            limits: { fileSize: 1000000 } // Limit file size if needed
        }).single('myFile'); // Name attribute in your HTML form

        upload(req, res, (err) => {
            if (err) {
                res.send('Error uploading file.');
            } else {
                if (req.file == undefined) {
                    res.send('Please select a file.');
                } else {
                    res.send('File uploaded successfully!');
                }
            }
        });

    } else {
        console.log(`Unauthorized GET to '/csv' from IP: ${req.ip}`)
        const error = new Error('User is not authorized to access this endpoint. This has been logged');
        error.status = 402;
        return next(error);
    }
}

async function Delete(req, res, next) {
    req.session.hasAccess = false;
    const csv2Get = req.query.data;
    let csvSource = csv2Get;
    req.session.hasAccess = await utils.checkPerms(req.session.signedInRole, `${csv2Get}`, "D")

    if (csv2Get.startsWith(`${req.session.signedInUser}/`)) {
        req.session.hasAccess = true;
        csvSource = csv2Get.substring(req.session.signedInUser.length + 1);
    }

    if (req.session.hasAccess) {

        utils.copyFile(`${__dirname}/clean-database/${csvSource}.csv`, `${__dirname}/database/${csv2Get}.csv`, (err) => {
            if (err) {
                console.error('Error copying file:', err);
            } else {
                console.log(`${csv2Get} deleted by User: ${req.session.signedInUser}`);
            }
        });

    }
}

module.exports = { Get, Post, Delete }