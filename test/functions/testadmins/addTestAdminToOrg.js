'use strict';
const expect = require('chai').expect;
const functionRunner = require('../../functionRunner.js');
const env = require('../../../functions/lib/env.js').withMockContext();
const databaseHelper = require('../../../functions/lib/helpers/databaseHelper.js').withEnv(env);

var testAdminObject = {
    AdministrationName: 'A Test Administration',
    AdministrationStartDate: '2016-07-05',
    AdministrationEndDate: '2016-07-15',
    Secured: true,
    Active: true
};

let testAdminId;

var secondTestAdminObject = {
    AdministrationName: 'Another Test Administration',
    AdministrationStartDate: '2016-07-05',
    AdministrationEndDate: '2016-07-15',
    Secured: true,
    Active: true
};

let secondTestAdminId;

var organizationObject = {
    OrganizationID: '98765',
    OrganizationName: 'Test Organization',
    ExternalID: 'i1234567890',
    ParentOrganizationID: '1',
    OrganizationType: 'Big Corp',
    Active: 1
};
var secondOrganizationObject = {
    "OrganizationID": '24680',
    "OrganizationName": 'Second School',
    "ExternalID": "99999",
    "OrganizationType": "99999"
};
var secondOrgAssociationObject = {
    "OrganizationID": '24680'
};
var secondTestAdminAssociationObject = {
    "OrganizationID": '98765'
};

describe('addTestAdminToOrganization', function () {
    beforeEach(function() {
        return databaseHelper.getQueryBuilder().then(knex => {
            return Promise.all([
                knex('test_administration').insert(testAdminObject).then(ids => {
                    testAdminId = ids[0];
                    secondOrgAssociationObject.TestAdministrationId = testAdminId;
                }),
                knex('organization').insert(organizationObject)
            ]);
        });
    });

    afterEach(function () {
        return databaseHelper.getQueryBuilder().then(knex => {
            return knex('test_administration_organization').del().then(() => knex);
        }).then(knex => {
            return Promise.all([
                knex('test_administration').del(),
                knex('organization').del()
            ]).then(() => knex);
        });
    });

    it('should succeed with valid TestAdministrationID and OrganizationID', function() {
        let addTestAdminToOrg = functionRunner.runFunction('addTestAdminToOrg', null, {
            path: {
                id: testAdminId,
                organizationId: '98765'
            }
        });

        return expect(addTestAdminToOrg).to.be.fulfilled.and.eventually.equal('Test administration added to organization');
    });

    it('should succeed even if other Organizations are associated with Test administration', function() {
        return databaseHelper.getQueryBuilder().then(knex => {
            // Insert second Org into database.
            return knex('organization').insert(secondOrganizationObject).then(() => knex);
        }).then(knex => {
            // Insert Test administration association to second Org.
            return knex('test_administration_organization').insert(secondOrgAssociationObject);
        }).then(() => {
            let addTestAdminToOrg = functionRunner.runFunction('addTestAdminToOrg', null, {
                path: {
                    id: testAdminId,
                    organizationId: '98765'
                }
            });

            return expect(addTestAdminToOrg).to.be.fulfilled.and.eventually.equal('Test administration added to organization');
        });
    });

    it('should succeed even if other Test administrations are associated with Organization', function() {
        return databaseHelper.getQueryBuilder().then(knex => {
            // Insert second Test administration into database.
            return knex('test_administration').insert(secondTestAdminObject).then(ids => {
                secondTestAdminId = ids[0];
                secondTestAdminAssociationObject.TestAdministrationId = secondTestAdminId;
            }).then(() => knex);
        }).then(knex => {
            // Insert Org association to second Test administration.
            return knex('test_administration_organization').insert(secondTestAdminAssociationObject);
        }).then(() => {
            let addTestAdminToOrg = functionRunner.runFunction('addTestAdminToOrg', null, {
                path: {
                    id: testAdminId,
                    organizationId: '98765'
                }
            });

            return expect(addTestAdminToOrg).to.be.fulfilled.and.eventually.equal('Test administration added to organization');
        });
    });

    it('should not allow empty TestAdministrationID', function() {
        let addTestAdminToOrg = functionRunner.runFunction('addTestAdminToOrg', null, {
            path: {
                id: '',
                organizationId: '98765'
            }
        });

        return expect(addTestAdminToOrg).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'Missing required value: TestAdministrationID'
        }));
    });

    it('should not allow invalid TestAdministrationID', function() {
        let addTestAdminToOrg = functionRunner.runFunction('addTestAdminToOrg', null, {
            path: {
                id: '3323333223',
                organizationId: '98765'
            }
        });

        return expect(addTestAdminToOrg).to.be.rejectedWith(JSON.stringify({
            responseCode: 404,
            errorMessage: 'Invalid TestAdministrationID'
        }));
    });

    it('should not allow invalid OrganizationID', function() {
        let addTestAdminToOrg = functionRunner.runFunction('addTestAdminToOrg', null, {
            path: {
                id: testAdminId,
                organizationId: '43948237429387'
            }
        });

        return expect(addTestAdminToOrg).to.be.rejectedWith(JSON.stringify({
            responseCode: 404,
            errorMessage: 'Invalid OrganizationID'
        }));
    });

    it('should not allow duplicate TestAdministrationID and OrganizationID combination', function() {

        let addTestAdminToOrg = databaseHelper.getQueryBuilder().then(knex => {
            return knex('test_administration_organization').insert({
                TestAdministrationID: testAdminId,
                OrganizationID: '98765'
            });
        }).then(() => {
            return functionRunner.runFunction('addTestAdminToOrg', null, {
                path: {
                    id: testAdminId,
                    organizationId: '98765'
                }
            });
        });

        return expect(addTestAdminToOrg).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'Association between test administration and organization already exists'
        }));
    });
});
