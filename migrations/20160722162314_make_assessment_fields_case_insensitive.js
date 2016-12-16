'use strict';
exports.up = function(knex, Promise) {
    return knex.raw("ALTER TABLE `assessment` CONVERT TO CHARACTER SET 'utf8' COLLATE 'utf8_unicode_ci'");
};

exports.down = function(knex, Promise) {
    return knex.raw("ALTER TABLE `assessment` CONVERT TO CHARACTER SET 'utf8' COLLATE 'utf8_bin'");
};
