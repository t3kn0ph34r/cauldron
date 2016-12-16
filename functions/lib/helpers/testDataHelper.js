'use strict';
const Model = require('../models/Model.js');
const stringUtil = require('../../../functions/lib/util/string.js');

/**
 * Provides a generic way of creating test data.
 * The 'options' parameter accepts an object whose values describe the type of data to create.
 * The types of values accepted can be expanded on as we require more elaborate functionality.
 *
 * Currently, the values supported are:
 *   - Strings in the form of 'foo:bar':
 *     * When {foo} is 'string', {bar} is the number of random characters comprising the string.
 *     ** Ex. When the string 'string:20' is provided, a random string of length 20 would be generated individually for each test case.
 *     * Otherwise, {bar} is 'default', indicating the regex pattern was matched, but a valid key was not passed.
 *
 *   - Functions:
 *     * Calls the given function for each test record.
 *
 *   - Any other type of input is used, unchanged.
 *     * Ex. When the integer 5 is provided, 5 would be used for all test cases.
 *
 * @param {int} number - The number of test records to create
 * @param {Object} options - An object whose values define the type of data to be created:
 * @returns {Object}
 */
function createTestData(number, options) {
    return new Array(number).fill(0).map((elem, i) => {
        let keys = Object.keys(options);
        let model = {};

        for (var k = 0; k < keys.length; k++) {
            model[keys[k]] = createPropertyValue(options[keys[k]]);
        }

        return model;
    });
}

/**
 * Creates the test data value for a field (not exported)
 *
 * @param descriptor
 * @returns {*}
 */
function createPropertyValue(descriptor) {
    // If the descriptor is a function, call it and return it
    if(typeof descriptor === 'function') {
        return descriptor();
    }

    // Check if the descriptor matches foo:bar format
    let matches = descriptor.match(/^([\d,\w]+)\s*:\s*([\d,\w]+)$/);

    // Otherwise, just return the descriptor as given
    if(matches === null) {
        return descriptor;
    }

    switch(matches[1]) {
        case 'string':
            return stringUtil.randomString(matches[2]);
        default:
            return 'default';
    }
}


module.exports = {
    createTestData
};