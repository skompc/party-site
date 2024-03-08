const fs = require('fs');
const utils = require('./utils');
const path = require('path');

utils.copyFile('./clean-database/logs.csv','./database/logs.csv')
utils.copyFile('./clean-database/perms.csv','./database/perms.csv')
utils.copyFile('./clean-database/users.csv','./database/users.csv')
utils.copyFile('./clean-database/submissions.csv','./database/submissions.csv')
utils.copyFile('./clean-database/applications.csv','./database/applications.csv')
utils.copyFile('./clean-database/msg.csv','./database/admin/msg.csv')