const fs = require('fs');
const util = require('util');
const path = require('path');
const http = require('http');
const https = require('https');
const bodyParser = require('body-parser');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');

const saltRounds = 10;

async function hash(input) {
  try {
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedInput = await bcrypt.hash(input, salt);
    return hashedInput;
  } catch (error) {
    console.log(`Input hash failed`)
    error = new Error('An unexpected error has occurred. Please try again.');
    error.status = 700;
    return next(error);
  }
}

// Function to compare a password with its hash
async function checkHash(input, hashedInput) {
  try {
    const match = await bcrypt.compare(input, hashedInput);
    return match;
  } catch (error) {
    console.log(`Hash check failed`)
    error = new Error('An unexpected error has occurred. Please try again.');
    error.status = 700;
    return next(error);
  }
}

function isPhoneNumber(input) {
  const phoneNumberPattern = /^\+?[\d()-]{10,}$/;
  return phoneNumberPattern.test(input.replace(/\s/g, '')); // Remove spaces before validation
}

function isEmailAddress(input) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(input.replace(/\s/g, ''));
}

function isZipCode(input) {
  const zipCodePattern = /^\d{5}(?:-\d{4})?$/;
  return zipCodePattern.test(input.replace(/\s/g, '')); // Remove spaces before validation
}

async function checkPerms(role, endpoint, permission) {

  const data = await fs.promises.readFile('database/perms.csv', 'utf8');
  const lines = data.trim().split('\n');

  let hasAccess = false;

  for (const line of lines) {
    const [roleCSV, endpointCSV, G, P, D] = line.trim().split(',');
    if (roleCSV != "Endpoint") {

      let isEndpointMatch = eval(endpoint === endpointCSV)
      let isRoleMatch = eval(role === roleCSV);

      if (endpoint === role){
        hasAccess = true;
        break;
      }

      let isPermissionMatch = "0";

      if (permission == "G") {
        isPermissionMatch = G
      } else if (permission == "P") {
        isPermissionMatch = P
      } else if (permission == "D") {
        isPermissionMatch = D
      } else {
        isPermissionMatch = "0"
      }

      if (isEndpointMatch && isRoleMatch && (isPermissionMatch === "1")) {
        // Verified!
        hasAccess = true;
        break; // Exit loop upon successful login
      }
    }
  }

  if (role === "owner") { hasAccess = true }

  return hasAccess;

}

async function logCSV(year, month, day, hour, minutes, seconds, message) {

  const csvData = `${year},${month},${day},${hour},${minutes},${seconds},${message}\n`;

  fs.appendFileSync(__dirname + '/database/logs.csv', csvData);
}

function copyFile(source, target) {
  // Create directory if it doesn't exist
  const targetDir = path.dirname(target);
  if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
  }

  // Copy file from source to destination
  fs.copyFile(source, target, (err) => {
      if (err) {
          console.error('Error copying file:', err);
      } else {
      }
  });
}

module.exports = { hash, checkHash, isPhoneNumber, isEmailAddress, isZipCode, checkPerms, logCSV, copyFile }