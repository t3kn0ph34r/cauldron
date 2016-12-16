'use strict';
exports.up = function(knex, Promise) {
  return Promise.all([
      knex.raw("ALTER TABLE `organization` " +
          "CHANGE COLUMN `ExternalID` `ExternalID` VARCHAR(30) NOT NULL, " +
          "CHANGE COLUMN `OrganizationType` `OrganizationType` VARCHAR(35) NOT NULL;").return(0)
  ]);
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.raw("ALTER TABLE `organization` " +
            "CHANGE COLUMN `ExternalID` `ExternalID` VARCHAR(30) NULL, " +
            "CHANGE COLUMN `OrganizationType` `OrganizationType` VARCHAR(35) NULL;").return(0)
    ]);
};
