'use strict';
const config = require('./config.js');
const args = require('minimist')(process.argv.slice(2));
const environments = require('./environments.json').environments;

let nonLocalEnvironments = environments.filter(env => env.name !== 'devlocal');

if (typeof args.env !== 'string') {
    console.error('No environment specified for deployment.');
    console.error('Usage: "node run-script deploy env [function]".');
    process.exit(1);
} else {
    if (!nonLocalEnvironments.some(env => args.env === env.name)) {
        console.error('"' + args.env + '" is not a valid environment. Valid environments: ');
        console.error(nonLocalEnvironments.map(env => env.name).join('\n'));
        process.exit(1);
    }
}


config.getConfigs().then(() => {
    console.log('Configs done');
}).then(() => {
    process.exit(0);
});