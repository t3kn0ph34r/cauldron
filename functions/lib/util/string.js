'use strict';

/**
 * Pads a number to the left with a given char to fill a given length
 *
 * @param {number} num
 * @param {number} len
 * @param {string} [char]
 * @return {string}
 */
function padLeft(num, len, char) {
    if (char === undefined) {
        char = '0';
    }

    let strNum = num.toString();
    if (strNum.length >= len) {
        return strNum;
    }

    return (char.repeat(len) + strNum).substr(-len);
}

/**
 * Creates a random string of a given length. Not cryptographically secure.
 *
 * @param length
 * @return {string}
 */
function randomString(length) {
    let chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let str = '';
    for (let i = 0; i < length; i++) {
        str += chars[Math.floor(Math.random() * chars.length)];
    }
    return str;
}

/**
 * Escapes a string to be used in a LIKE query
 *
 * @param {string} value
 */
function escapeLike(value) {
    return value.toString().replace(/_/g, '\\_').replace(/%/g, '\\%');
}

module.exports = {
    padLeft,
    randomString,
    escapeLike
};
