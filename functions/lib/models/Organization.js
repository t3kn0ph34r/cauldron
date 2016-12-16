'use strict';
const Model = require('./Model.js');
const databaseHelper = require('../helpers/databaseHelper.js');
const CauldronError = require('../util/error.js').CauldronError;
const objectUtil = require('../util/object.js');

module.exports = Model.define('Organization', {
    tableName: 'organization',
    idAttribute: 'OrganizationID',
    validations: {
        OrganizationID: [
            {
                rule: 'required',
                message: 'organization.missingOrgID'
            },
            {
                rule: 'maxLength:36',
                message: 'organization.tooLongOrgID'
            }
        ],
        OrganizationName: [
            {
                rule: 'required',
                message: 'organization.missingOrgName'
            },
            {
                rule: 'maxLength:80',
                message: 'organization.tooLongOrgName'
            }
        ],
        OrganizationType: [
            {
                rule: 'required',
                message: 'organization.missingOrgType'
            },
            {
                rule: 'maxLength:35',
                message: 'organization.tooLongOrgType'
            }
        ],
        ExternalID: [
            {
                rule: 'required',
                message: 'organization.missingExternalID'
            },
            {
                rule: 'maxLength:30',
                message: 'organization.tooLongExternalID'
            }
        ],
        ParentOrganizationID: [
            {
                rule: 'notSelfParentOrganizationId',
                message: 'organization.selfParentOrgID'
            }
        ]
    },

    customRules: [
        {
            name: 'parentOrgExists',
            ruleMethod: 'parentOrgExists'
        },
        {
            name: 'notSelfParentOrganizationId',
            ruleMethod: 'notSelfParentOrganizationId'
        }
    ],

    maybeValidations: [
        {
            conditionMethod: 'creatingAndRootOrgExists',
            validations: {
                ParentOrganizationID: [
                    {
                        rule: 'required',
                        message: 'organization.missingParentOrgID'
                    }
                ]
            }
        },
        {
            conditionMethod: 'rootOrgExists',
            validations: {
                ParentOrganizationID: [
                    {
                        rule: 'maxLength:36',
                        message: 'organization.tooLongParentOrgID'
                    },
                    {
                        rule: 'parentOrgExists'
                    }
                ]
            }
        },
        {
            conditionMethod: 'rootOrgNotExists',
            validations: {
                ParentOrganizationID: [
                    {
                        rule: 'empty',
                        message: 'organization.invalidParentOrgID'
                    }
                ]
            }
        }
    ],

    rootOrgExists: function(input) {
        return databaseHelper.withEnv(this.env).getQueryBuilder().then(knex => {

            // If at least one record exists in the database, then a root org exists
            return knex(this.tableName).first(knex.raw(1));

        }).then(row => {

            return !!row;
        });
    },

    notSelfParentOrganizationId: function (val) {
        return val !== this.get('OrganizationID');
    },

    creatingAndRootOrgExists: function () {
        if (!this.previous('OrganizationID')) {
            return this.rootOrgExists();
        }

        return false;
    },

    rootOrgNotExists: function() {
        return this.rootOrgExists().then(exists => !exists);
    },

    parentOrgExists: function () {
        return this.parentOrganization().fetch().then(parentOrg => {
            if (!parentOrg) {
                throw new CauldronError(this.config.get('errors.organization.invalidParentOrgID'));
            }
            return true;
        });
    },

    students: function () {
        return this.belongsToMany('Student', 'student_organization', 'OrganizationID', 'UserID');
    },

    testAdmins: function () {
        return this.belongsToMany('TestAdministration', 'test_administration_organization', 'OrganizationID', 'TestAdministrationID');
    },

    parentOrganization: function () {
        return this.belongsTo('Organization', 'ParentOrganizationID');
    },

    /**
     * Handles an error on save
     *
     * @param error
     * @return {Promise}
     */
    handleSaveError: function (error) {

        return new Promise((resolve, reject) => {
            return this.callSuper('handleSaveError', error).then(resolve).catch(error => {
                if (error.code === 'ER_DUP_ENTRY') {
                    return reject(new CauldronError(this.config.get('errors.organization.duplicateOrgID')));
                }

                if (error.code === 'ER_BAD_FIELD_ERROR') {
                    let fieldName = error.message.match(/Unknown column '(.*?)'/)[1];
                    let badFieldError = objectUtil.deepCopy(this.config.get('errors.generic.badField'));
                    badFieldError.errorMessage = badFieldError.errorMessage.replace('%FIELDNAME%', fieldName);

                    return reject(new CauldronError(badFieldError));
                }

                return reject(error);
            });
        });
    }
});