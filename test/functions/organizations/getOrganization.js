'use strict';
const expect = require('chai').expect;
const functionRunner = require('../../functionRunner.js');
const env = require('../../../functions/lib/env.js').withMockContext();
const databaseHelper = require('../../../functions/lib/helpers/databaseHelper.js').withEnv(env);

describe('getOrganization', function () {
    beforeEach(function () {
        return databaseHelper.getQueryBuilder().then(knex => {
            return knex('organization').insert({
                OrganizationID: '12345',
                OrganizationType: 'school',
                OrganizationName: 'foo',
                ExternalID: '99999'
            }).then(() => knex);
        }).then(knex => {
            return knex('organization').insert({
                OrganizationID: '56789',
                OrganizationType: 'school',
                OrganizationName: 'foo',
                ParentOrganizationID: '12345',
                ExternalID: '99999'
            });
        });
    });

    afterEach(function() {
        return databaseHelper.getQueryBuilder().then(knex => {
            return knex('organization').del();
        });
    });

// it('should return a 400 if organizationID is empty', function () {
//     let getOrganization = functionRunner.runFunction('getOrganization', {}, {path: {id: ''}});
//
//     return expect(getOrganization).to.be.rejectedWith(JSON.stringify({
//         responseCode: 400,
//         errorMessage: 'OrganizationID must not be empty'
//     }));
// });

    it('should return the correct organization if organizationID exists', function () {
        let getOrganization = functionRunner.runFunction('getOrganization', {}, {path: {id: '56789'}});

        return Promise.all([
            expect(getOrganization).to.be.fulfilled,
            expect(getOrganization).to.eventually.have.property('OrganizationID', '56789'),
            expect(getOrganization).to.eventually.have.property('OrganizationType', 'school'),
            expect(getOrganization).to.eventually.have.property('OrganizationName', 'foo'),
            expect(getOrganization).to.eventually.have.property('ParentOrganizationID', '12345'),
            expect(getOrganization).to.eventually.have.property('ExternalID', '99999'),
            expect(getOrganization).to.eventually.have.property('Active', 1),
            expect(getOrganization).to.eventually.have.property('CreatedAt'),
            expect(getOrganization).to.eventually.have.property('UpdatedAt')
        ]);
    });

    it('should return a 404 if organizationID does not exist', function () {
        let getOrganization = functionRunner.runFunction('getOrganization', {}, {path: {id: '00000'}});

        return expect(getOrganization).to.be.rejectedWith(JSON.stringify({
            responseCode: 404,
            errorMessage: 'Invalid OrganizationID'
        }));
    });
});
