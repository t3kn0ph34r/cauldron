'use strict';
exports.up = function(knex, Promise) {
  return Promise.all([{
      name: 'OrganizationName',
      size: 80
  }, {
      name: 'OrganizationType',
      size: 35
  }].map(column => {
      return knex.raw(`alter table \`organization\` change column \`${column.name}\` \`${column.name}\` VARCHAR(${column.size}) not null collate 'utf8_unicode_ci'`);
  }));
};

exports.down = function(knex, Promise) {
    return Promise.all([{
        name: 'OrganizationName',
        size: 80
    }, {
        name: 'OrganizationType',
        size: 35
    }].map(column => {
        return knex.raw(`alter table \`organization\` change column \`${column.name}\` \`${column.name}\` VARCHAR(${column.size}) not null collate 'utf8_bin'`);
    }));
};
