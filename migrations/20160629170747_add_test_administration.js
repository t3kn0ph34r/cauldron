'use strict';
const TABLE_NAME = 'test_administration';

exports.up = function(knex, Promise) {
    return knex.schema.createTable(TABLE_NAME, function(table) {
        table.increments('TestAdministrationID');
        table.string('AdministrationName', 50).notNullable();
        table.date('AdministrationStartDate').notNullable();
        table.date('AdministrationEndDate').notNullable();
        table.boolean('Secured').notNullable();
        table.boolean('Active').notNullable().defaultTo(true);
        table.timestamp('CreatedAt', true).defaultTo(knex.raw('CURRENT_TIMESTAMP'));
        table.timestamp('UpdatedAt', true).defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable(TABLE_NAME);
};
