'use strict';
exports.up = function(knex, Promise) {
  return Promise.all([
      knex.schema.table('organization', table => {
          table.boolean('Active').notNullable().defaultTo(1);
      })
  ]);
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.table('organization', table => {
            table.dropColumn('Active');
        })
    ]);
};
