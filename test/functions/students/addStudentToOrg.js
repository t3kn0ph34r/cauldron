'use strict';
const expect = require('chai').expect;
const functionRunner = require('../../functionRunner.js');
const env = require('../../../functions/lib/env.js').withMockContext();
const databaseHelper = require('../../../functions/lib/helpers/databaseHelper.js').withEnv(env);

var StudentObject = {
    UserID: '12345',
    StuGrade: '08',
    FirstName: 'Test',
    LastName: 'Student',
    Birthdate: '2002-03-01',
    ExternalID: 'Ext123',
    TestDeliveryAccessCode: 'ABC123',
    Accom01: true,
    Accom02: true,
    Accom03: true,
    Accom04: true,
    Accom05: true,
    Accom06: true,
    Accom07: true,
    Accom08: true,
    Accom09: true,
    Accom10: true,
    Accom11: true,
    Accom12: true,
    Accom13: true,
    Accom14: true,
    Accom15: true,
    Accom16: true,
    Accom17: true,
    Accom18: true,
    Accom19: true,
    Accom20: true,
    Accom21: true,
    Accom22: true,
    Accom23: true,
    Accom24: true,
    Accom25: true,
    Accom26: true,
    Accom27: true,
    Accom28: true,
    Accom29: true,
    Accom30: true
};
var SecondStudentObject = {
    UserID: '13579',
    StuGrade: '09',
    FirstName: 'Test2',
    LastName: 'Student2',
    Birthdate: '2002-03-01',
    ExternalID: 'Ext123',
    TestDeliveryAccessCode: 'XYZ987',
    Accom01: true,
    Accom02: true,
    Accom03: true,
    Accom04: true,
    Accom05: true,
    Accom06: true,
    Accom07: true,
    Accom08: true,
    Accom09: true,
    Accom10: true,
    Accom11: true,
    Accom12: true,
    Accom13: true,
    Accom14: true,
    Accom15: true,
    Accom16: true,
    Accom17: true,
    Accom18: true,
    Accom19: true,
    Accom20: true,
    Accom21: true,
    Accom22: true,
    Accom23: true,
    Accom24: true,
    Accom25: true,
    Accom26: true,
    Accom27: true,
    Accom28: true,
    Accom29: true,
    Accom30: true
};
var OrganizationObject = {
    OrganizationID: '98765',
    OrganizationName: 'Test Organization',
    ExternalID: 'i1234567890',
    ParentOrganizationID: '1',
    OrganizationType: 'Big Corp',
    Active: 1
};
var SecondOrganizationObject = {
    "OrganizationID": '24680',
    "OrganizationName": 'Second School',
    "ExternalID": "99999",
    "OrganizationType": "99999"
};
var SecondOrgAssociationObject = {
    "UserID": '12345',
    "OrganizationID": '24680'
};
var SecondStudentAssociationObject = {
    "UserID": '13579',
    "OrganizationID": '98765'
};

describe('addStudentToOrganization', function () {
    beforeEach(function() {
        return databaseHelper.getQueryBuilder().then(knex => {
            return Promise.all([
                knex('student').insert(StudentObject),
                knex('organization').insert(OrganizationObject)
            ]);
        });
    });

    afterEach(function () {
        return databaseHelper.getQueryBuilder().then(knex => {
            return knex('student_organization').del().then(() => knex);
        }).then(knex => {
            return Promise.all([
                knex('student').del(),
                knex('organization').del()
            ]).then(() => knex);
        });
    });

    it('should succeed with valid UserID and OrganizationID', function() {
        let addStudentToOrg = functionRunner.runFunction('addStudentToOrg', null, {
            path: {
                studentId: '12345',
                organizationId: '98765'
            }
        });

        return expect(addStudentToOrg).to.be.fulfilled.and.eventually.equal('Student added to organization');
    });

    it('should succeed even if other Organizations are associated with Student', function() {
        return databaseHelper.getQueryBuilder().then(knex => {
            // Insert second Org into database.
            return knex('organization').insert(SecondOrganizationObject).then(() => knex);
        }).then(knex => {
            // Insert Student association to second Org.
            return knex('student_organization').insert(SecondOrgAssociationObject);
        }).then(() => {
            let addStudentToOrg = functionRunner.runFunction('addStudentToOrg', null, {
                path: {
                    studentId: '12345',
                    organizationId: '98765'
                }
            });

            return expect(addStudentToOrg).to.be.fulfilled.and.eventually.equal('Student added to organization');
        });
    });

    it('should succeed even if other Students are associated with Organization', function() {
        return databaseHelper.getQueryBuilder().then(knex => {
            // Insert second Student into database.
            return knex('student').insert(SecondStudentObject).then(() => knex);
        }).then(knex => {
            // Insert Org association to second Student.
            return knex('student_organization').insert(SecondStudentAssociationObject);
        }).then(() => {
            let addStudentToOrg = functionRunner.runFunction('addStudentToOrg', null, {
                path: {
                    studentId: '12345',
                    organizationId: '98765'
                }
            });

            return expect(addStudentToOrg).to.be.fulfilled.and.eventually.equal('Student added to organization');
        });
    });

    it('should not allow empty UserID', function() {
        let addStudentToOrg = functionRunner.runFunction('addStudentToOrg', null, {
            path: {
                studentId: '',
                organizationId: '98765'
            }
        });

        return expect(addStudentToOrg).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'Missing required value: UserID'
        }));
    });

    it('should not allow invalid UserID', function() {
        let addStudentToOrg = functionRunner.runFunction('addStudentToOrg', null, {
            path: {
                studentId: '3323333223',
                organizationId: '98765'
            }
        });

        return expect(addStudentToOrg).to.be.rejectedWith(JSON.stringify({
            responseCode: 404,
            errorMessage: 'Invalid UserID'
        }));
    });

    it('should not allow invalid OrganizationID', function() {
        let addStudentToOrg = functionRunner.runFunction('addStudentToOrg', null, {
            path: {
                studentId: '12345',
                organizationId: '43948237429387'
            }
        });

        return expect(addStudentToOrg).to.be.rejectedWith(JSON.stringify({
            responseCode: 404,
            errorMessage: 'Invalid OrganizationID'
        }));
    });

    it('should not allow duplicate UserID and OrganizationID combination', function() {

        let addStudentToOrg1 = functionRunner.runFunction('addStudentToOrg', null, {
            path: {
                studentId: '12345',
                organizationId: '98765'
            }
        });

        return expect(addStudentToOrg1.then(() => {
            return functionRunner.runFunction('addStudentToOrg', null, {
                path: {
                    studentId: '12345',
                    organizationId: '98765'
                }
            });
        })).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'Association between student and organization already exists'
        }));
    });
});
