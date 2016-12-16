'use strict';
const BluebirdPromise = require('bluebird');
const Env = require('./env.js');
const Config = require('./config.js');
const CauldronError = require('./util/error.js').CauldronError;

/**
 * Intercept internal errors and format them for compatibility with API Gateway
 * @param context
 */
function interceptErrors(context) {
    let fail = context.fail;
    context.fail = function (err) {
        if (err instanceof Error && !(err instanceof CauldronError)) {
            err.message = JSON.stringify({
                responseCode: 500,
                errorMessage: err.message
            });
        }

        fail.apply(context, arguments);
    };
}

/**
 * Initialize the app within the context of the Lambda event
 *
 * @param event
 * @param context
 *
 * @return {Promise}
 */
function appBootstrap(event, context) {
    // re-initialize config
    let env = Env.withContext(event, context);
    let config = Config.withEnv(env);

    if (config.get('logEvent')) {
        console.log(event);
    }

    interceptErrors(context);

    return BluebirdPromise.resolve(env);
}

module.exports = appBootstrap;