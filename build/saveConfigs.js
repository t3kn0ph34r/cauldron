'use strict';
const config = require('./config.js');

config.saveConfigs().then(() => {
    console.log('Configs done');
}).then(() => {
    process.exit(0);
});