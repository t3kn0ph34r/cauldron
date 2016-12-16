'use strict';
const TABLE_NAME   = 'test_administration_organization';
const TESTADMIN_ID = 'TestAdministrationID';
const ORG_ID_NAME  = 'OrganizationID';

exports.up = function (knex, Promise) {
    return Promise.all([
        knex.schema.createTable(TABLE_NAME, function (table) {
            table.increments('TestAdministrationOrganizationID');
            table.integer(TESTADMIN_ID, 10).notNullable().unsigned();
            table.string(ORG_ID_NAME, 36).notNullable();
            table.timestamp('CreatedAt', true).defaultTo(knex.raw('CURRENT_TIMESTAMP'));
            table.timestamp('UpdatedAt', true).defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
            table.foreign(TESTADMIN_ID).references(TESTADMIN_ID).inTable('test_administration');
            table.foreign(ORG_ID_NAME).references(ORG_ID_NAME).inTable('organization');
        })
    ]).then(() => {
        // Use a custom key name, since the autogenerated key is too long
        return knex.raw('alter table `test_administration_organization` add unique `testadmin_org_unique` (`TestAdministrationID`, `OrganizationID`)');
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable(TABLE_NAME);
};
