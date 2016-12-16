'use strict';
const config = require('./config.js');

config.getConfigs().then(() => {
    console.log('Configs done');
}).then(() => {
    process.exit(0);
});