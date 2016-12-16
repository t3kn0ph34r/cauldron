'use strict';
const expect = require('chai').expect;
const env = require('../../../functions/lib/env.js').withMockContext();
const databaseHelper = require('../../../functions/lib/helpers/databaseHelper.js').withEnv(env);
const stringUtil = require('../../../functions/lib/util/string.js');
const functionRunner = require('../../functionRunner.js');

describe('getTestAdministrations - paged', function () {
    // populate the database with 200 randomized Test Administrations
    let testAdmins = Array(200).fill(0).map((elem, i) => {
        return {
            TestAdministrationID: i,
            AdministrationName: stringUtil.randomString(50),
            AdministrationStartDate: '2016-07-05',
            AdministrationEndDate: '2016-07-15',
            Secured: 1,
            Active: 1
        };
    }).sort((testAdminA, testAdminB) => {
        let nameA = testAdminA.AdministrationName.toLowerCase();
        let nameB = testAdminB.AdministrationName.toLowerCase();

        return nameA <= nameB ? nameA < nameB ? -1 : 0 : 1;
    });

    before(function () {
        return databaseHelper.getQueryBuilder().then(knex => {
            return knex('test_administration').insert(testAdmins);
        });
    });

    after(function() {
        return databaseHelper.getQueryBuilder().then(knex => {
            return knex('test_administration').del();
        });
    });

    it('should give the first 50 Test Administrations by default', function () {
        let getTestAdmins = functionRunner.runFunction('getTestAdministrations');

        return Promise.all([
            expect(getTestAdmins).to.be.fulfilled,
            expect(getTestAdmins).to.eventually.have.deep.property('models[0].TestAdministrationID', testAdmins[0].TestAdministrationID),
            expect(getTestAdmins).to.eventually.have.deep.property('models[0].AdministrationName', testAdmins[0].AdministrationName),
            expect(getTestAdmins).to.eventually.have.deep.property('models[0].AdministrationStartDate'),
            expect(getTestAdmins).to.eventually.have.deep.property('models[0].AdministrationEndDate'),
            expect(getTestAdmins).to.eventually.have.deep.property('models[49].TestAdministrationID', testAdmins[49].TestAdministrationID),
            expect(getTestAdmins).to.eventually.have.deep.property('models[49].AdministrationName', testAdmins[49].AdministrationName),
            expect(getTestAdmins).to.eventually.have.deep.property('models[49].AdministrationStartDate'),
            expect(getTestAdmins).to.eventually.have.deep.property('models[49].AdministrationEndDate'),
            expect(getTestAdmins).to.eventually.have.deep.property('pagination.offset', 0),
            expect(getTestAdmins).to.eventually.have.deep.property('pagination.limit', 50),
            expect(getTestAdmins).to.eventually.have.deep.property('pagination.rowCount', testAdmins.length),
            expect(getTestAdmins).to.eventually.have.lengthOf(50)
        ]);
    });

    it('should return the first 50 Test Administrations given an offset, but no limit', function () {
        let offset = 10;

        let getTestAdmins = functionRunner.runFunction('getTestAdministrations', null, {
            querystring: {
                offset: offset
            }
        });

        return Promise.all([
            expect(getTestAdmins).to.be.fulfilled,
            expect(getTestAdmins).to.eventually.have.deep.property('models[0].TestAdministrationID', testAdmins[0 + offset].TestAdministrationID),
            expect(getTestAdmins).to.eventually.have.deep.property('models[49].TestAdministrationID', testAdmins[49 + offset].TestAdministrationID),
            expect(getTestAdmins).to.eventually.have.deep.property('pagination.offset', offset),
            expect(getTestAdmins).to.eventually.have.deep.property('pagination.limit', 50),
            expect(getTestAdmins).to.eventually.have.lengthOf(50)
        ]);
    });

    it('should return the first n number of Test Administrations, given by the limit, with no offset', function () {
        let limit = 10;

        let getTestAdmins = functionRunner.runFunction('getTestAdministrations', null, {
            querystring: {
                limit: limit
            }
        });

        return Promise.all([
            expect(getTestAdmins).to.be.fulfilled,
            expect(getTestAdmins).to.eventually.have.deep.property('models[0].TestAdministrationID', testAdmins[0].TestAdministrationID),
            expect(getTestAdmins).to.eventually.have.deep.property(`models[${limit - 1}].TestAdministrationID`, testAdmins[limit - 1].TestAdministrationID),
            expect(getTestAdmins).to.eventually.have.deep.property('pagination.offset', 0),
            expect(getTestAdmins).to.eventually.have.deep.property('pagination.limit', limit),
            expect(getTestAdmins).to.eventually.have.lengthOf(limit)
        ]);
    });

    it('should return the first n TestAdministrations after a given offset, if given both offset and limit', function () {
        let limit = 10;
        let offset = 10;

        let getTestAdmins = functionRunner.runFunction('getTestAdministrations', null, {
            querystring: {
                limit: limit,
                offset: offset
            }
        });

        return Promise.all([
            expect(getTestAdmins).to.be.fulfilled,
            expect(getTestAdmins).to.eventually.have.deep.property('models[0].TestAdministrationID', testAdmins[0 + offset].TestAdministrationID),
            expect(getTestAdmins).to.eventually.have.deep.property(`models[${limit - 1}].TestAdministrationID`, testAdmins[limit - 1 + offset].TestAdministrationID),
            expect(getTestAdmins).to.eventually.have.deep.property('pagination.offset', offset),
            expect(getTestAdmins).to.eventually.have.deep.property('pagination.limit', limit),
            expect(getTestAdmins).to.eventually.have.lengthOf(limit)
        ]);
    });

    it('should be sorted by name', function () {
        let getTestAdmins = functionRunner.runFunction('getTestAdministrations');

        return Promise.all([
            expect(getTestAdmins).to.be.fulfilled,
            getTestAdmins.then(pagination => {
                let testAdmins = pagination.models;
                // iterate through result set and confirm that each AdministrationName is less than or equal to the next, alphabetically
                let sorted = true;
                for (var i = 0; i < testAdmins.length - 1; i++) {
                    if (testAdmins[i].AdministrationName.toLowerCase() > testAdmins[i+1].AdministrationName.toLowerCase()) {
                        sorted = false;
                        break;
                    }
                }

                return expect(sorted).to.be.true;
            })
        ]);
    });

    it('should not allow a request beyond the bounds of the database', function () {
        let offset = 201;

        let getTestAdmins = functionRunner.runFunction('getTestAdministrations', null, {
            querystring: {
                offset: offset
            }
        });

        return expect(getTestAdmins).to.be.rejectedWith(JSON.stringify({
            "responseCode": 404,
            "errorMessage":  "Page not found"
        }));
    });

    it('should return partial data if the limit is higher than the number of rows found at the given offset', function () {
        let offset = 190;
        let limit = 20;


        let getTestAdmins = functionRunner.runFunction('getTestAdministrations', null, {
            querystring: {
                offset: offset,
                limit: limit
            }
        });

        return Promise.all([
            expect(getTestAdmins).to.be.fulfilled,
            expect(getTestAdmins).to.eventually.have.deep.property('models[0].TestAdministrationID', testAdmins[0 + offset].TestAdministrationID),
            expect(getTestAdmins).to.eventually.have.deep.property('models[9].TestAdministrationID', testAdmins[9 + offset].TestAdministrationID),
            expect(getTestAdmins).to.eventually.have.deep.property('models[9].TestAdministrationID', testAdmins[9 + offset].TestAdministrationID),
            expect(getTestAdmins).to.eventually.have.deep.property('pagination.offset', offset),
            expect(getTestAdmins).to.eventually.have.deep.property('pagination.limit', limit),
            expect(getTestAdmins).to.eventually.have.lengthOf(10)
        ]);
    });
});