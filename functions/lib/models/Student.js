'use strict';
const Model = require('./Model.js');
const databaseHelper = require('../helpers/databaseHelper.js');
const BlueBirdPromise = require('../util/promise.js').BluebirdPromise;
const CauldronError = require('../util/error.js').CauldronError;
const objectUtil = require('../util/object.js');
const stringUtil = require('../util/string.js');

module.exports = Model.define('Student', {
    tableName: 'student',
    idAttribute: 'UserID',
    accomCount: 30,
    validations: {
        UserID: [
            {
                rule: 'required',
                message: 'student.missingUserID'
            },
            {
                rule: 'maxLength:36',
                message: 'student.tooLongUserID'
            },
            {
                rule: 'requiredMultipleAccomXX'
            },
            {
                rule: 'booleanMultipleAccomXX'
            }
        ],
        StuGrade: [
            {
                rule: 'required',
                message: 'student.missingStuGrade'
            },
            {
                rule: 'maxLength:2',
                message: 'student.tooLongStuGrade'
            }
        ],
        FirstName: [
            {
                rule: 'required',
                message: 'student.missingFirstName'
            },
            {
                rule: 'maxLength:35',
                message: 'student.tooLongFirstName'
            }
        ],
        MiddleName: [
            {
                rule: 'maxLength:35',
                message: 'student.tooLongMiddleName'
            }
        ],
        LastName: [
            {
                rule: 'required',
                message: 'student.missingLastName'
            },
            {
                rule: 'maxLength:35',
                message: 'student.tooLongLastName'
            }
        ],
        Birthdate: [
            {
                rule: 'required',
                message: 'student.missingBirthdate'
            },
            {
                rule: 'maxLength:10',
                message: 'student.tooLongBirthdate'
            }
        ],
        ExternalID: [
            {
                rule: 'required',
                message: 'student.missingExternalID'
            },
            {
                rule: 'maxLength:30',
                message: 'student.tooLongExternalID'
            }
        ],
        TestDeliveryAccessCode: [
            {
                rule: 'required',
                message: 'student.missingTestDeliveryAccessCode'
            },
            {
                rule: 'maxLength:20',
                message: 'student.tooLongTestDeliveryAccessCode'
            }
        ]
    },

    customRules: [
        {
            name: 'notChangedUserId',
            ruleMethod: 'notChangedUserId'
        },
        {
            name: 'requiredMultipleAccomXX',
            ruleMethod: 'requiredMultipleAccomXX'
        },
        {
            name: 'booleanMultipleAccomXX',
            ruleMethod: 'booleanMultipleAccomXX'
        }
    ],

    maybeValidations: [
        {
            conditionMethod: 'updating',
            validations: {
                UserID: [
                    {
                        rule: 'notChangedUserId',
                        message: 'student.changeUserID'
                    }
                ]
            }
        }
    ],

    updating: function () {
        return !!this.previous('UserID');
    },

    notChangedUserId: function () {
        return this.changed.UserID === undefined;
    },

    requiredMultipleAccomXX: function () {
        for (let i = 1; i <= this.accomCount; i++) {
            let name = 'Accom' + stringUtil.padLeft(i, 2);

            if (!this.has(name)) {
                throw new CauldronError(this.config.get('errors.student.missing' + name));
            }
        }
        return true;
    },

    booleanMultipleAccomXX: function () {
        for (let i = 1; i <= this.accomCount; i++) {
            let name = 'Accom' + stringUtil.padLeft(i, 2);

            let val = this.get(name);
            if (!(val === 0 || val === 1 || typeof val === 'boolean')) {
                throw new CauldronError(this.config.get('errors.student.nonBoolean' + name));
            }
        }
        return true;
    },

    organizations: function () {
        return this.belongsToMany('Organization', 'student_organization', 'UserID', 'OrganizationID');
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
                    return reject(new CauldronError(this.config.get('errors.student.duplicateUserID')));
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
