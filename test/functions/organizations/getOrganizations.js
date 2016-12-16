'use strict';
const expect = require('chai').expect;
const env = require('../../../functions/lib/env.js').withMockContext();
const databaseHelper = require('../../../functions/lib/helpers/databaseHelper.js').withEnv(env);
const stringUtil = require('../../../functions/lib/util/string.js');
const testingUtil = require('../../../functions/lib/util/testing.js');
const arrayUtil = require('../../../functions/lib/util/array.js');
const functionRunner = require('../../functionRunner.js');

describe('getOrganizations - paged, filtered, and sorted', function() {
    /**
     * Tests whether the results of a promise are sorted
     *
     * @param promise
     * @param field
     * @param ascending
     * @param caseSensitive
     * @return {Promise}
     */
    function testSort(promise, field, ascending, caseSensitive) {
        let models = promise.then(pagination => pagination.models);
        return testingUtil.expect(expect, models).toBeSortedByField(field, ascending, caseSensitive);
    }

    /**
     * Replaces a string into another string at a given index
     *
     * @param target
     * @param str
     * @param index
     * @return {string}
     */
    function replaceStringAtPosition(target, str, index) {
        if (index < 0) {
            str = str.substr(-index);

        }

        index = Math.max(0, index);
        return (target.substr(0, index) + str + target.substr(index+str.length)).substr(0,target.length);
    }
    let stringToFind = 'AAAAAAA';
    let rootOrgId = stringUtil.randomString(36);
    
    // populate the database with 250 randomized orgs
    let organizations = Array(250).fill(0).map((elem, i) => {
        return {
            OrganizationID: i === 0 ? rootOrgId : stringUtil.randomString(36),
            OrganizationName: stringUtil.randomString(80),
            ExternalID: stringUtil.randomString(30),
            ParentOrganizationID: i === 0 ? null : rootOrgId,
            OrganizationType: stringUtil.randomString(35),
            Active: 1
        };
    });

    let otherParentOrgId = organizations[5].OrganizationID;
    for (let i = 0; i < organizations.length; i++) {

        if ([1,2,3].indexOf(i % 5) !== -1) {
            organizations[i].ParentOrganizationID = otherParentOrgId;
        }

        if ([2,3,4].indexOf(i % 5) !== -1) {
            // replace the string with "AAAAAAA" at index 10
            organizations[i].OrganizationName = replaceStringAtPosition(organizations[i].OrganizationName, stringToFind, 10);
        }
    }

    organizations.sort((orgA, orgB) => {
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

    it('should return the first 50 results by default, sorted by OrganizationName', function() {
        let getOrgs = functionRunner.runFunction('getOrganizations');
        return Promise.all([
            expect(getOrgs).to.eventually.be.fulfilled,
            expect(getOrgs).to.eventually.have.deep.property('models[0].OrganizationID', organizations[0].OrganizationID),
            expect(getOrgs).to.eventually.have.deep.property('models[49].OrganizationID', organizations[49].OrganizationID),
            expect(getOrgs).to.eventually.have.lengthOf(50),
            testSort(getOrgs, 'OrganizationName', true)
        ]);
    });

    it('should page and sort ascending', function() {
        let limit = 20;
        let offset = 10;
        let sort = 'OrganizationType';
        let getOrg = functionRunner.runFunction('getOrganizations', null, {
            querystring: {
                limit, offset, sort
            }
        });

        let sorted  = arrayUtil.sortByField(organizations, sort, true);

        return Promise.all([
            expect(getOrg).to.eventually.be.fulfilled,
            expect(getOrg).to.eventually.have.deep.property('models[0].OrganizationID', sorted[offset].OrganizationID),
            expect(getOrg).to.eventually.have.deep.property(`models[${limit - 1}].OrganizationID`, sorted[limit - 1 + offset].OrganizationID),
            expect(getOrg).to.eventually.have.lengthOf(limit),
            testSort(getOrg, sort, true)
        ]);
    });

    it('should page and sort descending', function() {
        let limit = 20;
        let offset = 10;
        let sort = 'OrganizationType';
        let getOrg = functionRunner.runFunction('getOrganizations', null, {
            querystring: {
                limit, offset, sort: '-' + sort
            }
        });

        let sorted  = arrayUtil.sortByField(organizations, sort, false);

        return Promise.all([
            expect(getOrg).to.eventually.be.fulfilled,
            expect(getOrg).to.eventually.have.deep.property('models[0].OrganizationID', sorted[offset].OrganizationID),
            expect(getOrg).to.eventually.have.deep.property(`models[${limit - 1}].OrganizationID`, sorted[limit - 1 + offset].OrganizationID),
            expect(getOrg).to.eventually.have.lengthOf(limit),
            testSort(getOrg, sort, false)
        ]);
    });

    it('should filter and sort ascending', function () {
        let sort = 'OrganizationType';
        let getOrg = functionRunner.runFunction('getOrganizations', null, {
            querystring: {
                sort,
                OrganizationName: stringToFind
            }
        });

        let filtered = organizations.filter((org) => {
            return org.OrganizationName.toLowerCase().indexOf(stringToFind.toLowerCase()) !== -1;
        });

        let sorted  = arrayUtil.sortByField(filtered, sort, true);

        return Promise.all([
            expect(getOrg).to.eventually.be.fulfilled,
            expect(getOrg).to.eventually.have.deep.property('models[0].OrganizationID', sorted[0].OrganizationID),
            expect(getOrg).to.eventually.have.deep.property('models[49].OrganizationID', sorted[49].OrganizationID),
            expect(getOrg).to.eventually.have.lengthOf(50),
            testSort(getOrg, sort, true)
        ]);
    });

    it('should filter and sort descending', function() {
        let sort = 'OrganizationType';
        let getOrg = functionRunner.runFunction('getOrganizations', null, {
            querystring: {
                sort: '-' + sort,
                OrganizationName: stringToFind
            }
        });

        let filtered = organizations.filter((org) => {
            return org.OrganizationName.toLowerCase().indexOf(stringToFind.toLowerCase()) !== -1;
        });

        let sorted  = arrayUtil.sortByField(filtered, sort, false);

        return Promise.all([
            expect(getOrg).to.eventually.be.fulfilled,
            expect(getOrg).to.eventually.have.deep.property('models[0].OrganizationID', sorted[0].OrganizationID),
            expect(getOrg).to.eventually.have.deep.property('models[49].OrganizationID', sorted[49].OrganizationID),
            expect(getOrg).to.eventually.have.lengthOf(50),
            testSort(getOrg, sort, false)
        ]);
    });

    it('should page and filter', function() {
        let limit = 20;
        let offset = 10;
        let getOrg = functionRunner.runFunction('getOrganizations', null, {
            querystring: {
                limit,
                offset,
                OrganizationName: stringToFind
            }
        });

        let filtered = organizations.filter((org) => {
            return org.OrganizationName.toLowerCase().indexOf(stringToFind.toLowerCase()) !== -1;
        });

        return Promise.all([
            expect(getOrg).to.eventually.be.fulfilled,
            expect(getOrg).to.eventually.have.deep.property('models[0].OrganizationID', filtered[offset].OrganizationID),
            expect(getOrg).to.eventually.have.deep.property(`models[${limit - 1}].OrganizationID`, filtered[limit - 1 + offset].OrganizationID),
            expect(getOrg).to.eventually.have.lengthOf(limit)
        ]);
    });

    it('should page, filter, and sort ascending', function() {
        let limit = 20;
        let offset = 10;
        let sort = 'OrganizationType';
        let getOrg = functionRunner.runFunction('getOrganizations', null, {
            querystring: {
                limit,
                offset,
                sort,
                OrganizationName: stringToFind
            }
        });

        let filtered = organizations.filter((org) => {
            return org.OrganizationName.toLowerCase().indexOf(stringToFind.toLowerCase()) !== -1;
        });

        let sorted = arrayUtil.sortByField(filtered, sort, true);

        return Promise.all([
            expect(getOrg).to.eventually.be.fulfilled,
            expect(getOrg).to.eventually.have.deep.property('models[0].OrganizationID', sorted[offset].OrganizationID),
            expect(getOrg).to.eventually.have.deep.property(`models[${limit - 1}].OrganizationID`, sorted[limit - 1 + offset].OrganizationID),
            expect(getOrg).to.eventually.have.lengthOf(limit),
            testSort(getOrg, sort, true)
        ]);
    });

    it('should page, filter, and sort descending', function() {
        let limit = 20;
        let offset = 10;
        let sort = 'OrganizationType';
        let getOrg = functionRunner.runFunction('getOrganizations', null, {
            querystring: {
                limit,
                offset,
                sort: '-' + sort,
                OrganizationName: stringToFind
            }
        });

        let filtered = organizations.filter((org) => {
            return org.OrganizationName.toLowerCase().indexOf(stringToFind.toLowerCase()) !== -1;
        });

        let sorted = arrayUtil.sortByField(filtered, sort, false);

        return Promise.all([
            expect(getOrg).to.eventually.be.fulfilled,
            expect(getOrg).to.eventually.have.deep.property('models[0].OrganizationID', sorted[offset].OrganizationID),
            expect(getOrg).to.eventually.have.deep.property(`models[${limit - 1}].OrganizationID`, sorted[limit - 1 + offset].OrganizationID),
            expect(getOrg).to.eventually.have.lengthOf(limit),
            testSort(getOrg, sort, false)
        ]);
    });
});