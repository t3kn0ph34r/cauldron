'use strict';
exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.table('student', table => {
            table.string('ExternalID',30).notNullable();
        })
    ]);
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.table('student', table => {
            table.dropColumn('ExternalID');
        })
    ]);
};
