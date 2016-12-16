'use strict';
const BluebirdPromise = require('bluebird');

/**
 * Passes a test if the promise resolves/rejects to the provided properties
 *
 * @param {function} expect
 * @param {Promise} promise
 * @param {Object} properties - An object with properties and their values to be asserted
 * @param {string[]} keys - an array of properties to be asserted for their existence
 * @return Promise
 */
function expectPromiseToHaveProperties(expect, promise, properties, keys) {
    if (Array.isArray(keys)) {
        keys = [];
    }

    if (properties === null || typeof properties !== 'object') {
        properties = {};
    }


    return BluebirdPromise.all(
        [].concat(
            Object.keys(properties).map(
                prop => expect(promise).to.eventually.have.property(prop, properties[prop])
            ),
            keys.map(
                key => expect(promise).to.eventually.have.property(key)
            )
        )
    );

}
/**
 * Tests whether a resolved promise matches a date string (YYYY-MM-DD)
 *
 * @param expect
 * @param promise
 * @param property
 * @param string
 * @return {*}
 */
function expectPromiseToMatchDateString(expect, promise, string) {
    return promise.then(date => {
        return expect(new Date(date).toISOString().substr(0, 10)).to.equal(string);
    });
}

/**
 * Tests whether a property of the resolved promise matches a date string (YYYY-MM-DD)
 *
 * @param expect
 * @param promise
 * @param property
 * @param string
 * @return {*}
 */
function expectPromisePropertyToMatchDateString(expect, promise, property, string) {
    return promise.then(obj => {
        return expectPromiseToMatchDateString(expect, Promise.resolve(obj[property]), string);
    });
}
/**
 * Tests whether the results are sorted by a field
 *
 * @param expect
 * @param promise
 * @param column
 * @param ascending
 * @param caseSensitive
 * @return {*}
 */
function testSorted(expect, promise, column, ascending, caseSentitive) {
    return promise.then(models => {
        // iterate through result set and confirm that each field is in order relative to the next
        let sorted = true;
        let message;

        for (var i = 0; i < models.length - 1; i++) {
            if (models[i][column] === undefined || models[i+1][column] === undefined) {
                sorted = false;
                message = 'Column ' + column + ' is undefined on this resultset';
            }

            let field1 = models[i][column];
            let field2 = models[i+1][column];

            if (typeof field1 === 'string' && !caseSentitive) {
                field1 = field1.toLowerCase();
                field2 = field2.toLowerCase();
            }

            if ((ascending && field1 > field2) || (!ascending && field1 < field2)) {
                sorted = false;
                message = 'Unexpected sort order';
                break;
            }
        }

        return expect(sorted).to.equal(true,message);
    });
}

module.exports = {
    expect: (expect, promise) => {
        return {
            toMatchDateString(string) {
                return expectPromiseToMatchDateString(expect, promise, string);
            },
            propertyToMatchDateString(property, string) {
                return expectPromisePropertyToMatchDateString(expect, promise, property, string);
            },
            toHaveProperties(properties, keys) {
                return expectPromiseToHaveProperties(expect, promise, properties, keys);
            },
            toBeSortedByField(column, ascending, caseSensitive) {
                return testSorted(expect, promise, column, ascending, caseSensitive);
            }
        };
    }
};