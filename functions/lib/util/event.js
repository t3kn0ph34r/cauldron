'use strict';

/**
 * Gets the requested input parameter value from the event's query string.
 *
 * @param {Object} event
 * @param {string} paramName
 * @returns {string}
 */
function getQueryStringParam(event, paramName) {
    return event.params && event.params.querystring ? event.params.querystring[paramName] : null;
}

/**
 * Gets the entire query string object.
 *
 * @param {Object} event
 * @returns {Object}
 */
function getQueryString(event) {
    return event.params && event.params.querystring ? event.params.querystring : null;
}

module.exports = {
    getQueryStringParam,
    getQueryString
};