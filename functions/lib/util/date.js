'use strict';
const stringUtil = require('../../../functions/lib/util/string.js');

function randomDate() {
    let year = Math.floor(Math.random() * 46) + 1970;
    let month = stringUtil.padLeft(Math.floor(Math.random() * 12) + 1, 2);

    let multiplier;
    switch (parseInt(month)) {
        case 9:
        case 4:
        case 6:
        case 11:
            multiplier = 30;
            break;
        case 2:
            multiplier = 28;
            break;
        default:
            multiplier = 31;
    }

    let day = stringUtil.padLeft(Math.floor(Math.random() * multiplier) + 1, 2);

    return `${year}-${month}-${day} 00:00:00`;
}

function yearAfter(date) {
    return date.replace(/^\d{4}/, function(str) {
        return parseInt(str) + 1;
    });
}

module.exports = {
    randomDate,
    yearAfter
};