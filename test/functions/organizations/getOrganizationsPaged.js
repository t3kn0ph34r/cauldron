'use strict';
const expect = require('chai').expect;
const env = require('../../../functions/lib/env.js').withMockContext();
const databaseHelper = require('../../../functions/lib/helpers/databaseHelper.js').withEnv(env);
const stringUtil = require('../../../functions/lib/util/string.js');
const functionRunner = require('../../functionRunner.js');

describe('getOrganizations - paged', function () {
    let rootOrgId = stringUtil.randomString(36);
    // populate the database with 200 randomized orgs
    let organizations = Array(200).fill(0).map((elem, i) => {
        return {
            OrganizationID: i === 0 ? rootOrgId : stringUtil.randomString(36),
            OrganizationName: stringUtil.randomString(80),
            ExternalID: stringUtil.randomString(30),
            ParentOrganizationID: i === 0 ? null : rootOrgId,
            OrganizationType: stringUtil.randomString(35)
        };
    }).sort((orgA, orgB) => {
        let nameA = orgA.OrganizationName.toLowerCase();
        let nameB = orgB.OrganizationName.toLowerCase();

        return nameA <= nameB ? nameA < nameB ? -1 : 0 : 1;
    });

    before(function () {
        return databaseHelper.getQueryBuilder().then(knex => {
            return knex('organization').insert(organizations);
        });
    });

    after(function() {
        return databaseHelper.getQueryBuilder().then(knex => {
            return knex('organization').del();
        });
    });

    it('should give the first 50 organzations by default', function () {
        let getOrgs = functionRunner.runFunction('getOrganizations');

        return Promise.all([
            expect(getOrgs).to.be.fulfilled,
            expect(getOrgs).to.eventually.have.deep.property('models[0].OrganizationID', organizations[0].OrganizationID),
            expect(getOrgs).to.eventually.have.deep.property('models[49].OrganizationID', organizations[49].OrganizationID),
            expect(getOrgs).to.eventually.have.deep.property('pagination.offset', 0),
            expect(getOrgs).to.eventually.have.deep.property('pagination.limit', 50),
            expect(getOrgs).to.eventually.have.deep.property('pagination.rowCount', organizations.length),
            expect(getOrgs).to.eventually.have.lengthOf(50)
        ]);
    });

    it('should give the first 50 organizations after a given offset, if given no limit', function () {
        let offset = 10;

        let getOrgs = functionRunner.runFunction('getOrganizations', null, {
            querystring: {
                offset: offset
            }
        });

        return Promise.all([
            expect(getOrgs).to.be.fulfilled,
            expect(getOrgs).to.eventually.have.deep.property('models[0].OrganizationID', organizations[0 + offset].OrganizationID),
            expect(getOrgs).to.eventually.have.deep.property('models[49].OrganizationID', organizations[49 + offset].OrganizationID),
            expect(getOrgs).to.eventually.have.deep.property('pagination.offset', offset),
            expect(getOrgs).to.eventually.have.deep.property('pagination.limit', 50),
            expect(getOrgs).to.eventually.have.lengthOf(50)
        ]);
    });

    it('should give the first n organizations as described by the limit, if given no offset', function () {
        let limit = 10;

        let getOrgs = functionRunner.runFunction('getOrganizations', null, {
            querystring: {
                limit: limit
            }
        });

        return Promise.all([
            expect(getOrgs).to.be.fulfilled,
            expect(getOrgs).to.eventually.have.deep.property('models[0].OrganizationID', organizations[0].OrganizationID),
            expect(getOrgs).to.eventually.have.deep.property(`models[${limit - 1}].OrganizationID`, organizations[limit - 1].OrganizationID),
            expect(getOrgs).to.eventually.have.deep.property('pagination.offset', 0),
            expect(getOrgs).to.eventually.have.deep.property('pagination.limit', limit),
            expect(getOrgs).to.eventually.have.lengthOf(limit)
        ]);
    });

    it('should give the first n organizations after a given offset, if given both offset and limit', function () {
        let limit = 10;
        let offset = 10;

        let getOrgs = functionRunner.runFunction('getOrganizations', null, {
            querystring: {
                limit: limit,
                offset: offset
            }
        });

        return Promise.all([
            expect(getOrgs).to.be.fulfilled,
            expect(getOrgs).to.eventually.have.deep.property('models[0].OrganizationID', organizations[0 + offset].OrganizationID),
            expect(getOrgs).to.eventually.have.deep.property(`models[${limit - 1}].OrganizationID`, organizations[limit - 1 + offset].OrganizationID),
            expect(getOrgs).to.eventually.have.deep.property('pagination.offset', offset),
            expect(getOrgs).to.eventually.have.deep.property('pagination.limit', limit),
            expect(getOrgs).to.eventually.have.lengthOf(limit)
        ]);
    });

    it('should be sorted by name', function () {
        let getOrgs = functionRunner.runFunction('getOrganizations');

        return Promise.all([
            expect(getOrgs).to.be.fulfilled,
            getOrgs.then(pagination => {
                let orgs = pagination.models;
                // iterate through result set and confirm that each org name is less than or equal to the next, alphabetically
                let sorted = true;
                for (var i = 0; i < orgs.length - 1; i++) {
                    if (orgs[i].OrganizationName.toLowerCase() > orgs[i+1].OrganizationName.toLowerCase()) {
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

        let getOrgs = functionRunner.runFunction('getOrganizations', null, {
            querystring: {
                offset: offset
            }
        });
        
        return expect(getOrgs).to.be.rejectedWith(JSON.stringify({
            "responseCode": 404,
            "errorMessage":  "Page not found"
        }));
    });

    it('should return partial data if the limit is higher than the number of rows found at the given offset', function () {
        let offset = 190;
        let limit = 20;


        let getOrgs = functionRunner.runFunction('getOrganizations', null, {
            querystring: {
                offset: offset,
                limit: limit
            }
        });

        return Promise.all([
            expect(getOrgs).to.be.fulfilled,
            expect(getOrgs).to.eventually.have.deep.property('models[0].OrganizationID', organizations[0 + offset].OrganizationID),
            expect(getOrgs).to.eventually.have.deep.property('models[9].OrganizationID', organizations[9 + offset].OrganizationID),
            expect(getOrgs).to.eventually.have.deep.property('models[9].OrganizationID', organizations[9 + offset].OrganizationID),
            expect(getOrgs).to.eventually.have.deep.property('pagination.offset', offset),
            expect(getOrgs).to.eventually.have.deep.property('pagination.limit', limit),
            expect(getOrgs).to.eventually.have.lengthOf(10)
        ]);
    });
});