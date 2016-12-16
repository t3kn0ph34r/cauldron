'use strict';
exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.table('organization', table => {
            table.renameColumn('ExternalId', 'ExternalID');
        })
    ]);
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.table('organization', table => {
            table.renameColumn('ExternalID', 'ExternalId');
        })
    ]);
};
