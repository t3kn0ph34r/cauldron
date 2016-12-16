'use strict';
exports.up = function(knex, Promise) {
    return knex.raw("alter table `test_administration` change column `AdministrationName` `AdministrationName` VARCHAR(50) not null collate 'utf8_unicode_ci'");
};

exports.down = function(knex, Promise) {
    return knex.raw("alter table `test_administration` change column `AdministrationName` `AdministrationName` VARCHAR(50) not null collate 'utf8_bin'");
};
