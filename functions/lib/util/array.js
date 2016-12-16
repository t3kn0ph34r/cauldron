'use strict';

/**
 * returns the list of organizations, sorted by field
 *
 * @param arr
 * @param field
 * @param ascending
 * @param caseSensitive
 * @return {Array.<T>}
 */
function sortByField(arr, field, ascending, caseSensitive) {
    const multiplier = ascending ? 1 : -1;
    return arr.slice().sort(function(org1, org2) {
        let field1 = org1[field];
        let field2 = org2[field];

        if (typeof field1 === 'string' && !caseSensitive) {
            field1 = field1.toLowerCase();
            field2 = field2.toLowerCase();
        }

        return multiplier * (field1 <= field2 ? field1 < field2 ? -1 : 0 : 1);
    });
}

module.exports = {
    sortByField
};