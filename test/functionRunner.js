'use strict';
const path = require('path');
const stream = require('stream');
const Serverless = require('serverless');
const SCli = require('../node_modules/serverless/lib/utils/cli.js');
const projectPath = path.join(__dirname, '../');
const env = require('../functions/lib/env.js').withMockContext();
const config = require('../functions/lib/config.js').withEnv(env);
const request = require('request');
const BlueBirdPromise = require('../functions/lib/util/promise.js').BluebirdPromise;
const aws4 = require('aws4');
const qs = require('querystring');

const getServerless = (function () {
    let serverlessPromise;

    return function initServerless() {
        if (! serverlessPromise) {
            let serverless = new Serverless({
                interactive: false,
                projectPath: projectPath
            });

            serverlessPromise = serverless.init().then(() => serverless);
        }

        return serverlessPromise;
    };
}());

/**
 * Run a function locally
 *
 * @param serverless
 * @param functionName
 * @param stage
 * @param region
 * @return {*}
 */
function runFunctionLocal(serverless, functionName, stage, region) {
    // call the function using the devint stage
    return serverless.actions.functionRun({
        name: functionName,
        stage: stage
    }).then((lambda) => {

        if (lambda.data.result.status === 'error') {
            throw lambda.data.result.error;
        }

        return lambda.data.result.response;
    });
}

/**
 * Run a function remotely
 *
 * @param serverless
 * @param functionName
 * @param event
 * @param stage
 * @param authenticate
 * @returns {Promise}
 */
function runFunctionRemote(serverless, functionName, event, stage, authenticate) {
    const remoteFunction = serverless.getProject().getFunction(functionName);

    const testEndpoint = remoteFunction.endpoints.filter(endpoint => {
        return endpoint.path.startsWith('test/');
    })[0];

    if (!testEndpoint) {
        throw new Error('No test endpoint set up for ' + functionName);
    }

    const protocol = config.get('apiGateway.protocol');
    const host = config.get('apiGateway.host');
    const method = testEndpoint.method;


    // replace the "{}" placeholders in the path with the actual values provided in the event
    const path = testEndpoint.path.replace(/\{([^}]*)}/g, (pathVarWithBraces, pathVar) => {
        const path = event.params.path || {};
        return path[pathVar] || '';
    });

    // by default, use JSON
    const headers = event.params.header || {};
    if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    // Add authentication headers if 'Authorization' is not provided
    if(authenticate) {
        let signature = aws4.sign({
            "host": host,
            "path": `/${stage}/${path}`,
            "method": "POST",
            "headers": {
                "Content-Type": "application/json"
            },
            "body": JSON.stringify(event.bodyJson)
        }, config.get('aws.credentials'));

        headers.Authorization = signature.headers.Authorization;
        headers['X-Amz-Date'] = signature.headers['X-Amz-Date'];
    }

    let url = `${protocol}://${host}/${stage}/${path}`;
    if (event.params.querystring) {
        let parsedString = qs.stringify(event.params.querystring);
        if (parsedString) {
            url += '?' + parsedString;
        }
    }
    return new BlueBirdPromise((resolve, reject) => {
        const options = {
            url: url,
            headers: headers,
            method: method
        };


        // only use the body if it's a POST, PUT, CONNECT, or PATCH, otherwise don't use
        if(['post', 'put', 'connect', 'patch'].some(httpMethod => method.toLowerCase() === httpMethod)) {
            options.body = JSON.stringify(event.bodyJson)|| '';
        }

        request(options, (err, response, body) => {
            if (response.headers['content-type'].startsWith('application/json')) {
                body = JSON.parse(body);
            }

            if (err ) {
                reject(err);
            } else if (response.statusCode >= 400) {
                reject(JSON.stringify(body));
            } else {
                resolve(body);
            }
        });
    });
}

function runFunction(functionName, event, params , stage, region, authenticate) {
    // if there's no event data specified, the function will read from event.json
    if (event === undefined) {
        event = null;
    }

    event = {
        'params': params || {},
        'bodyJson': event,
        'context': {
            'test': true
        }
    };

    if (typeof stage === 'undefined' || stage === null) {
        stage = process.env.NODE_ENV || 'devlocal';
    }

    if (typeof region === 'undefined' || region === null) {
        region = 'us-east-1';
    }

    return getServerless().then(serverless => {
        let stdinDescriptor = Object.getOwnPropertyDescriptor(process, 'stdin');

        // redefine process.stdin as a new mock stream so that serverless.actions.functionRun doesn't break
        Object.defineProperty(process, 'stdin', {
            value: new (class extends stream.Duplex {
                _write(data, encoding, done) {
                    done();
                }

                read() {
                    return JSON.stringify(event);
                }

                on(event) {
                    super.on.apply(this, arguments);

                    // call these functions immediately when functionRun needs them
                    if (event === 'readable' || event === 'end') {
                        this.emit(event);
                    }
                }
            })()
        });

        // mimic the cwd of the function call
        let cwd = process.cwd();
        process.chdir(path.join(projectPath, 'functions'));

        // get rid of the Serverless logging
        let log = SCli.log;
        SCli.log = () => {};

        let runFunctionPromise;
        if (stage === 'devlocal') {
            runFunctionPromise = runFunctionLocal(serverless, functionName, stage, region);
        } else {
            runFunctionPromise = runFunctionRemote(serverless, functionName, event, stage, authenticate);
        }

        return runFunctionPromise.finally(() => {
            // bring stdin back to normal
            Object.defineProperty(process, 'stdin', stdinDescriptor);

            // bring cwd back to normal
            process.chdir(cwd);

            //bring logging back to normal
            SCli.log = log;
        });
    });
}

module.exports = {
    runFunction,
    getServerless
};

// if this module is called from the command line, run the function
if (require.main === module) {
    const args = require('minimist')(process.argv.slice(2));
    const functionName = args._[0];
    const stage = args.s || 'devlocal';
    const event = null;
    const region = 'us-east-1';

    return module.exports.runFunction(functionName, event, stage, region).then(data => {
        console.log(data);
        process.exit(0);
    }).catch(err => {
        console.error(err);
        process.exit(1);
    });
}