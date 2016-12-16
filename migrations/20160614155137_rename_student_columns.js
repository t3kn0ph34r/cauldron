'use strict';
exports.up = function(knex, Promise) {
  return Promise.all([
      knex.schema.table('student', table => {
          table.renameColumn('StudentID', 'UserID');
          table.renameColumn('StudentGrade', 'StuGrade');
      })
  ]);
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.table('student', table => {
            table.renameColumn('UserID', 'StudentID');
            table.renameColumn('StuGrade', 'StudentGrade');
        })
    ]);
};
