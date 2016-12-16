'use strict';
exports.up = function(knex, Promise) {
    return Promise.all([
        // Knex is not good at modifying columns
        knex.raw("ALTER TABLE `student` " +
                    "CHANGE COLUMN `studentId` `StudentID` varchar(36) NOT NULL, " +
                    "CHANGE COLUMN `gradeLevel` `StudentGrade` varchar(2) NOT NULL, " +
                    "CHANGE COLUMN `firstName` `FirstName` varchar(35) NOT NULL, " +
                    "CHANGE COLUMN `middleName` `MiddleName` varchar(35) NULL, " +
                    "CHANGE COLUMN `lastName` `LastName` varchar(35) NOT NULL, " +
                    "CHANGE COLUMN `dateOfBirth` `Birthdate` varchar(10) NOT NULL, " +
                    "CHANGE COLUMN `createdAt` `CreatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, " +
                    "CHANGE COLUMN `updatedAt` `UpdatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;").return()
    ]).then(() =>{
        return knex.schema.table('student', table => {
            table.dropColumn('organizationId');
            table.dropColumn('stateOrganizationId');
            table.dropColumn('schoolYear');
            table.dropColumn('studentIdentifier');
            table.boolean('Accom01').notNullable();
            table.boolean('Accom02').notNullable();
            table.boolean('Accom03').notNullable();
            table.boolean('Accom04').notNullable();
            table.boolean('Accom05').notNullable();
            table.boolean('Accom06').notNullable();
            table.boolean('Accom07').notNullable();
            table.boolean('Accom08').notNullable();
            table.boolean('Accom09').notNullable();
            table.boolean('Accom10').notNullable();
            table.boolean('Accom11').notNullable();
            table.boolean('Accom12').notNullable();
            table.boolean('Accom13').notNullable();
            table.boolean('Accom14').notNullable();
            table.boolean('Accom15').notNullable();
            table.boolean('Accom16').notNullable();
            table.boolean('Accom17').notNullable();
            table.boolean('Accom18').notNullable();
            table.boolean('Accom19').notNullable();
            table.boolean('Accom20').notNullable();
            table.boolean('Accom21').notNullable();
            table.boolean('Accom22').notNullable();
            table.boolean('Accom23').notNullable();
            table.boolean('Accom24').notNullable();
            table.boolean('Accom25').notNullable();
            table.boolean('Accom26').notNullable();
            table.boolean('Accom27').notNullable();
            table.boolean('Accom28').notNullable();
            table.boolean('Accom29').notNullable();
            table.boolean('Accom30').notNullable();
            table.string('TestDeliveryAccessCode', 20).notNullable();
            table.boolean('Active').notNullable().defaultTo(1);
        });
    });
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema
            .table('student', table => {
                table.integer('organizationId').notNullable();
                table.integer('stateOrganizationId').nullable();
                table.string('studentIdentifier', 30).notNullable();
                table.dropColumn('Accom01');
                table.dropColumn('Accom02');
                table.dropColumn('Accom03');
                table.dropColumn('Accom04');
                table.dropColumn('Accom05');
                table.dropColumn('Accom06');
                table.dropColumn('Accom07');
                table.dropColumn('Accom08');
                table.dropColumn('Accom09');
                table.dropColumn('Accom10');
                table.dropColumn('Accom11');
                table.dropColumn('Accom12');
                table.dropColumn('Accom13');
                table.dropColumn('Accom14');
                table.dropColumn('Accom15');
                table.dropColumn('Accom16');
                table.dropColumn('Accom17');
                table.dropColumn('Accom18');
                table.dropColumn('Accom19');
                table.dropColumn('Accom20');
                table.dropColumn('Accom21');
                table.dropColumn('Accom22');
                table.dropColumn('Accom23');
                table.dropColumn('Accom24');
                table.dropColumn('Accom25');
                table.dropColumn('Accom26');
                table.dropColumn('Accom27');
                table.dropColumn('Accom28');
                table.dropColumn('Accom29');
                table.dropColumn('Accom30');
                table.dropColumn('TestDeliveryAccessCode');
                table.dropColumn('Active');
            })

    ]).then(() => {
        return Promise.all([
            knex.raw("ALTER TABLE `student` " +
                        "CHANGE COLUMN `StudentID` `studentId` INT(11) NOT NULL AUTO_INCREMENT FIRST, " +
                        "CHANGE COLUMN `StudentGrade` `gradeLevel` varchar(2) NULL, " +
                        "CHANGE COLUMN `FirstName` `firstName` varchar(40) NOT NULL, " +
                        "CHANGE COLUMN `MiddleName` `middleName` varchar(40) NULL, " +
                        "CHANGE COLUMN `LastName` `lastName` varchar(40) NOT NULL, " +
                        "CHANGE COLUMN `Birthdate` `dateOfBirth` date NULL, " +
                        "CHANGE COLUMN `CreatedAt` `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, " +
                        "CHANGE COLUMN `UpdatedAt` `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, " +
                        "ADD COLUMN schoolYear char(4) NULL DEFAULT '2014';").return()
        ]);
    });
};
