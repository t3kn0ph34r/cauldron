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
var OrganizationObject = {
    OrganizationID: '98765',
    OrganizationName: 'Test Organization',
    ExternalID: 'i1234567890',
    ParentOrganizationID: '1',
    OrganizationType: 'Big Corp',
    Active: 1
};
var StudentOrganizationObject = {
    "UserID": '12345',
    "OrganizationID": '98765'
};

describe('removeStudentFromOrganization', function () {
    beforeEach(function() {
        return databaseHelper.getQueryBuilder().then(knex => {
            return Promise.all([
                knex('student').insert(StudentObject),
                knex('organization').insert(OrganizationObject)
            ]).then(() => knex);
        }).then(knex => {
            return knex('student_organization').insert(StudentOrganizationObject);
        });
    });

    afterEach(function () {
        return databaseHelper.getQueryBuilder().then(knex => {
            return knex('student_organization').del().then(() => knex);
        }).then(knex => {
            return Promise.all([
                knex('student').del(),
                knex('organization').del()
            ]);
        });
    });

    it('should succeed with existing UserID and OrganizationID', function() {
        let removeStudentFromOrg = functionRunner.runFunction('removeStudentFromOrg', null, {
            path: {
                studentId:      StudentObject.UserID,
                organizationId: OrganizationObject.OrganizationID
            }
        });

        return expect(removeStudentFromOrg).to.be.fulfilled.and.eventually.equal('Student was removed from organization');
    });

    it('should not succeed when relationship doesn\'t exist', function() {
        return databaseHelper.getQueryBuilder().then(knex => {
            return knex('student_organization').del().then(() => {
                let removeStudentFromOrg = functionRunner.runFunction('removeStudentFromOrg', null, {
                    path: {
                        studentId:      StudentObject.UserID,
                        organizationId: OrganizationObject.OrganizationID
                    }
                });

                return expect(removeStudentFromOrg).to.be.rejectedWith(JSON.stringify({
                    responseCode: 404,
                    errorMessage: 'Association between student and organization does not exist'
                }));
            });
        });
    });

    it('should not not allow invalid UserID', function() {
        let removeStudentFromOrg = functionRunner.runFunction('removeStudentFromOrg', null, {
            path: {
                studentId:      '382938932398',
                organizationId: OrganizationObject.OrganizationID
            }
        });

        return expect(removeStudentFromOrg).to.be.rejectedWith(JSON.stringify({
            responseCode: 404,
            errorMessage: 'Invalid UserID'
        }));
    });

    it('should not allow invalid OrganizationID', function() {
        let removeStudentFromOrg = functionRunner.runFunction('removeStudentFromOrg', null, {
            path: {
                studentId:      StudentObject.UserID,
                organizationId: '238989283928370238'
            }
        });

        return expect(removeStudentFromOrg).to.be.rejectedWith(JSON.stringify({
            responseCode: 404,
            errorMessage: 'Invalid OrganizationID'
        }));
    });
});