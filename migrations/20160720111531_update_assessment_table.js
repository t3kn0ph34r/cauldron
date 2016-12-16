'use strict';
exports.up = function(knex) {
    // first remove the foreign key constraint so assessmentId can be modified
    return knex.schema.table('test_administration_assessment', function(table){
        table.dropForeign('AssessmentID');
    }).then(() => {
        return knex.schema.table('assessment', function (table) {
            // rename some of the columns
            table.renameColumn('assessmentName', 'AssessmentName');
            table.renameColumn('gradeLevel', 'GradeLevel');
            table.renameColumn('subject', 'Subject');
        });
    }).then(() => {
        // rename some of the columns that can't be done using knex's api
        return knex.raw('ALTER TABLE `assessment` ' +
            'CHANGE COLUMN `assessmentId` `AssessmentID` INT(11) NOT NULL AUTO_INCREMENT, ' +
            'CHANGE COLUMN `createdAt` `CreatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, ' +
            'CHANGE COLUMN `updatedAt` `UpdatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;');
    }).then(() => {
        // add the foreign key constraint with the new column name
        return knex.schema.table('test_administration_assessment', function(table){
            table.foreign('AssessmentID').references('AssessmentID').inTable('assessment');
        });
    });
};

exports.down = function(knex) {
    // first remove the foreign key constraint so AssessmentID can be modified
    return knex.schema.table('test_administration_assessment', function(table){
        table.dropForeign('AssessmentID');
    }).then(() => {
        return knex.schema.table('assessment', function (table) {
            // rename some of the columns
            table.renameColumn('AssessmentName', 'assessmentName');
            table.renameColumn('GradeLevel', 'gradeLevel');
            table.renameColumn('Subject', 'subject');
        });
    }).then(() => {
        // rename some of the columns that can't be done using knex's api
        return knex.raw('ALTER TABLE `assessment` ' +
            'CHANGE COLUMN `AssessmentId` `assessmentID` INT(11) NOT NULL AUTO_INCREMENT, ' +
            'CHANGE COLUMN `CreatedAt` `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, ' +
            'CHANGE COLUMN `UpdatedAt` `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;');
    }).then(() => {
        // add the foreign key constraint with the old column name
        return knex.schema.table('test_administration_assessment', function(table){
            table.foreign('AssessmentID').references('assessmentId').inTable('assessment');
        });
    });
};
