'use strict';
const Serverless = require('serverless');
const path = require('path');
const projectPath = path.join(__dirname, '../');
const args = require('minimist')(process.argv.slice(2));
const functionName = typeof args.function === 'string' ? args.function : null;

const serverless = new Serverless({
    interactive: false,
    projectPath
});

/**
 * @param {Endpoint} endpoint
 * @return {string}
 */
function getEndpointString(endpoint) {
    return endpoint.path + '~' + endpoint.method.toUpperCase();
}

serverless.init().then(() => {
    let project = serverless.getProject();
    let endpoints;
    if (functionName) {
        endpoints = project.getFunction(functionName).endpoints;
    } else {
        endpoints = project.getAllEndpoints();
    }

    console.log(endpoints.map(getEndpointString).join(' '));
    process.exit(0);
});