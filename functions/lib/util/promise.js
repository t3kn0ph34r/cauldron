'use strict';
const BluebirdPromise = require('bluebird');

/**
 * Decorates a function to execute only once, and return a promise with the value returned by that function.
 *
 * @param promise
 * @return {Function}
 */
function methodOnce(promiseReturningFunction) {
    let promise;
    return function() {
        if (arguments.length) {
            throw new Error('A method defined with methodOnce cannot be called with arguments.');
        }
        if (!promise) {
            promise = BluebirdPromise.try(() => {
                return promiseReturningFunction.apply(this, arguments);
            });
        }

        return promise;
    };
}


module.exports = {
    BluebirdPromise,
    methodOnce
};