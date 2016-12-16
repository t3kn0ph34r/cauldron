'use strict';
const path = require('path');
// set vars required by the config module
const NODE_ENV = process.env.NODE_ENV || process.env.SERVERLESS_STAGE || 'devlocal';
const NODE_BASE_CONFIG_DIR = path.join(__dirname, 'config');
const NODE_CONFIG_DIR = path.join(NODE_BASE_CONFIG_DIR, NODE_ENV);
const NODE_APP_INSTANCE = 'secure';

// set these as env vars
process.env.NODE_ENV = NODE_ENV;
process.env.NODE_CONFIG_DIR = NODE_CONFIG_DIR;
process.env.NODE_APP_INSTANCE = NODE_APP_INSTANCE;
process.env.SUPPRESS_NO_CONFIG_WARNING = true;

const ENVIRONMENTS = {
    devlocal: 'devlocal',
    devint: 'devint',
    qa: 'qa',
    uat: 'uat',
    prod: 'prod'
};

/**
 * Initializes environment variables based on the event that's been given to the Lambda function
 *
 * @param event
 * @return {Env}
 */
function withContext(event, context) {
    return new Env({
        context: context,
        event: event,
        test: event.context.test || process.argv[1].indexOf('mocha') !== -1
    });
}

/**
 * @class Env
 * @property {boolean} test
 * @property {Object} event
 * @property {Object} context
 */
class Env {
    /**
     * @param {Object} options
     * @param {boolean} options.test
     * @param {string} options.event
     * @param {string} options.context
     */
    constructor(options) {
        this.event = options.event;
        this.context = options.context;
        this.vars = {};
        this.test = Boolean(options.test) || process.argv[1].indexOf('mocha') !== -1;
    }
    
    /**
     * Gives the current environment name
     *
     * @return {string}
     */
    getEnv() {
        return process.env.NODE_ENV;
    }
    
    /**
     * Returns true if the current environment is in the argument list, false otherwise
     *
     * @param {...string} environment
     * @return {boolean}
     */
    is(environment) {
        const environmentNames = [].slice.call(arguments);
        return environmentNames.indexOf(process.env.NODE_ENV) !== 1;
    }

    /**
     * Returns true if this is a testing environment, false otherwise
     *
     * @return {boolean}
     */
    isTest() {
        return this.test;
    }
}

let mockEnv = null;
function withMockContext(test) {
    if (test === undefined || test) {
        test = 1;
    } else {
        test = 0;
    }

    if (!mockEnv) {
        return new Env({
            event: {
                context: {
                    test: test
                }
            },
            context: {
                succeed: function (data) {
                    return Promise.resolve(data);
                },
                fail: function (data) {
                    return Promise.reject(data);
                }
            },
            test: test
        });
    }

    return mockEnv;
}

module.exports = {
    ENVIRONMENTS,
    withContext,
    withMockContext
};