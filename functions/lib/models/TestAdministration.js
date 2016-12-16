'use strict';
const Model = require('./Model.js');
const databaseHelper = require('../helpers/databaseHelper.js');
const BlueBirdPromise = require('../util/promise.js').BluebirdPromise;
const CauldronError = require('../util/error.js').CauldronError;
const objectUtil = require('../util/object.js');

module.exports = Model.define('TestAdministration', {
    tableName: 'test_administration',
    idAttribute: 'TestAdministrationID',
    validations: {
        AdministrationName: [
            {
                rule: 'required',
                message: 'testAdmin.missingAdminName'
            },
            {
                rule: 'maxLength:50',
                message: 'testAdmin.tooLongAdminName'
            }
        ],
        AdministrationStartDate: [
            {
                rule: 'required',
                message: 'testAdmin.missingStartDate'
            },
            {
                rule: 'dateRegex',
                message: 'testAdmin.invalidStartDate'
            }
        ],
        AdministrationEndDate: [
            {
                rule: 'required',
                message: 'testAdmin.missingEndDate'
            },
            {
                rule: 'dateRegex',
                message: 'testAdmin.invalidEndDate'
            }
        ],
        Secured: [
            {
                rule: 'required',
                message: 'testAdmin.missingSecured'
            },
            {
                rule: 'boolean',
                message: 'testAdmin.invalidSecured'
            }
        ],
        Active: [
            {
                rule: 'boolean',
                message: 'testAdmin.invalidActive'
            }
        ]
    },

    customRules: [
        {
            name: 'dateRegex',
            ruleMethod: 'dateRegex'
        }
    ],

    dateRegex: function (val) {
        return !!val.toString().match(/^\d{4}-\d{2}-\d{2}$/);
    },

    organizations: function () {
        return this.belongsToMany('Organization', 'test_administration_organization', 'TestAdministrationID', 'OrganizationID');
    },

    assessments: function () {
        return this.belongsToMany('Assessment', 'test_administration_assessment', 'TestAdministrationID', 'AssessmentID');
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