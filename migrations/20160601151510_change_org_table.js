'use strict';
exports.up = function(knex, Promise) {
    return Promise.all([
        // Knex is not good at modifying columns
        knex.raw("ALTER TABLE `organization` " +
                    "CHANGE COLUMN `createdAt` `CreatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, " +
                    "CHANGE COLUMN `updatedAt` `UpdatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, " +
                    "CHANGE COLUMN  `organizationId` `organizationId` varchar(36), " +
                    "CHANGE COLUMN  `parentOrganizationId` `parentOrganizationId` varchar(36), " +
                    "CHANGE COLUMN  `organizationIdentifier` `organizationIdentifier` varchar(30);").return()
    ]).then(() =>{
        return knex.schema.table('organization', table => {
            table.dropColumn('organizationCity');
            table.dropColumn('organizationLevel');
            table.renameColumn('organizationIdentifier', 'ExternalId');
            table.renameColumn('organizationId', 'OrganizationID');
            table.renameColumn('parentOrganizationId', 'ParentOrganizationID');
            table.renameColumn('organizationName', 'OrganizationName');
            table.string('OrganizationType', 35);
        });
    });
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema
            .table('organization', table => {
                table.string('organizationCity', 40).nullable();
                table.renameColumn('ExternalId','organizationIdentifier');
                table.renameColumn('OrganizationName', 'organizationName');
                table.renameColumn('OrganizationID', 'organizationId');
                table.renameColumn('ParentOrganizationID', 'parentOrganizationId');
                table.dropColumn('OrganizationType');
            })

    ]).then(() => {
        return Promise.all([
            knex.raw("ALTER TABLE `organization` " +
                        "ADD COLUMN `organizationLevel` TINYINT(4) NOT NULL, " +
                        "CHANGE COLUMN `CreatedAt` `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, " +
                        "CHANGE COLUMN `UpdatedAt` `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, " +
                        "CHANGE COLUMN `organizationId` `organizationId` INT(11) NOT NULL AUTO_INCREMENT FIRST, " +
                        "CHANGE COLUMN  `parentOrganizationId` `parentOrganizationId` INT(11), " +
                        "CHANGE COLUMN `organizationIdentifier` `organizationIdentifier` VARCHAR(80);").return()
        ]);
    });
};
