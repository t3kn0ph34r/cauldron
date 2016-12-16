'use strict';
const expect = require('chai').expect;
const functionRunner = require('../../functionRunner.js');
const env = require('../../../functions/lib/env.js').withMockContext();
const databaseHelper = require('../../../functions/lib/helpers/databaseHelper.js').withEnv(env);

var testAdminObject = {
    TestAdministrationID: 1,
    AdministrationName: 'Test Administration',
    AdministrationStartDate: '2016-02-18',
    AdministrationEndDate: '2016-02-28',
    Secured: true,
    Active: true
};

describe('getTestAdmin', function () {
    before(function() {
        return databaseHelper.getQueryBuilder().then(knex => {
            return knex('test_administration').insert(testAdminObject);
        });
    });

    after(function() {
        return databaseHelper.getQueryBuilder().then(knex => {
            return knex('test_administration').del();
        });
    });

    it('should return the testAdminObject when requesting correct ID', function() {
        let getTestAdministration = functionRunner.runFunction('getTestAdministration', {}, {path: {id: '1'}});

        return Promise.all([
            expect(getTestAdministration).to.be.fulfilled,
            expect(getTestAdministration).to.eventually.have.property('AdministrationName', testAdminObject.AdministrationName),
            expect(getTestAdministration).to.eventually.have.property('AdministrationStartDate'),
            expect(getTestAdministration).to.eventually.have.property('AdministrationEndDate'),
            expect(getTestAdministration).to.eventually.have.property('Secured', testAdminObject.Secured ? 1 : 0),
            expect(getTestAdministration).to.eventually.have.property('Active', testAdminObject.Active ? 1: 0),
            expect(getTestAdministration).to.eventually.have.property('UpdatedAt'),
            expect(getTestAdministration).to.eventually.have.property('CreatedAt')
        ]);
    });

    it('should return error when TestAdministrationID is not found', function() {
        let getTestAdministration = functionRunner.runFunction('getTestAdministration', {}, {path: {id: 12345}});

        return expect(getTestAdministration).to.be.rejectedWith(JSON.stringify({
            responseCode: 404,
            errorMessage: 'Invalid TestAdministrationID'
        }));
    });

    it('should not allow an improperly formatted TestAdministrationID', function() {
        let getTestAdministration = functionRunner.runFunction('getTestAdministration', {}, {path: {id: 'abc'}});

        return expect(getTestAdministration).to.be.rejectedWith(JSON.stringify({
            responseCode: 404,
            errorMessage: 'Invalid TestAdministrationID'
        }));
    });
});