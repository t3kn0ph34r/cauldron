'use strict';
const TABLE_NAME   = 'student_organization';
const USER_ID_NAME = 'UserID';
const ORG_ID_NAME  = 'OrganizationID';

exports.up = function (knex, Promise) {
    return Promise.all([
        knex.schema.createTable(TABLE_NAME, function (table) {
            table.increments('StudentOrganizationID');
            table.string(USER_ID_NAME, 36).notNullable();
            table.string(ORG_ID_NAME, 36).notNullable();
            table.timestamp('CreatedAt', true).defaultTo(knex.raw('CURRENT_TIMESTAMP'));
            table.timestamp('UpdatedAt', true).defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
            table.unique([USER_ID_NAME, ORG_ID_NAME]);
            table.foreign(USER_ID_NAME).references(USER_ID_NAME).inTable('student');
            table.foreign(ORG_ID_NAME).references(ORG_ID_NAME).inTable('organization');
        })
    ]);
};

exports.down = function (knex, Promise) {
    return knex.schema.dropTable(TABLE_NAME);
};
