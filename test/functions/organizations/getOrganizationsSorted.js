'use strict';
const expect = require('chai').expect;
const env = require('../../../functions/lib/env.js').withMockContext();
const databaseHelper = require('../../../functions/lib/helpers/databaseHelper.js').withEnv(env);
const stringUtil = require('../../../functions/lib/util/string.js');
const dateUtil = require('../../../functions/lib/util/date.js');
const testingUtil = require('../../../functions/lib/util/testing.js');
const functionRunner = require('../../functionRunner.js');

function testSort(promise, field, ascending, caseSensitive) {
    let models = promise.then(pagination => pagination.models);
    
    return Promise.all([
        expect(promise).to.be.fulfilled,
        testingUtil.expect(expect, models).toBeSortedByField(field, ascending, caseSensitive)
    ]);
}

describe('getOrganizations - sorted', function () {

    let rootOrgId = stringUtil.randomString(36);
    // populate the database with 200 randomized orgs
    let organizations = Array(200).fill(0).map((elem, i) => {
        let createdAt = dateUtil.randomDate();
        let updatedAt = dateUtil.yearAfter(createdAt);

        return {
            OrganizationID: i === 0 ? rootOrgId : stringUtil.randomString(36),
            OrganizationName: stringUtil.randomString(80),
            ExternalID: stringUtil.randomString(30),
            ParentOrganizationID: i === 0 ? null : rootOrgId,
            OrganizationType: stringUtil.randomString(35),
            CreatedAt: createdAt,
            UpdatedAt: updatedAt
        };
    }).sort((orgA, orgB) => {
        let nameA = orgA.OrganizationName.toLowerCase();
        let nameB = orgB.OrganizationName.toLowerCase();

        return nameA <= nameB ? nameA < nameB ? -1 : 0 : 1;
    });

    before(function () {
        return databaseHelper.getQueryBuilder().then(knex => {
            return knex('organization').insert(organizations).catch(e => {
                console.log(e);
                throw e;
            });
        });
    });

    after(function() {
        return databaseHelper.getQueryBuilder().then(knex => {
            return knex('organization').del();
        });
    });

    it('should be sorted by OrganizationName by default', function () {
        let getOrgs = functionRunner.runFunction('getOrganizations');

        return testSort(getOrgs, 'OrganizationName', true);
    });

    it('should allow sorting by OrganizationType ascending', function () {
            let getOrgs = functionRunner.runFunction('getOrganizations', null, {
                querystring: {
                    sort: 'OrganizationType'
                }
            });

        return testSort(getOrgs, 'OrganizationType', true);

    });

    it('should allow sorting by OrganizationType descending', function () {
        let getOrgs = functionRunner.runFunction('getOrganizations', null, {
            querystring: {
                sort: '-OrganizationType'
            }
        });

        return testSort(getOrgs, 'OrganizationType', false);

    });

    it('should allow sorting by OrganizationName ascending', function () {
        let getOrgs = functionRunner.runFunction('getOrganizations', null, {
            querystring: {
                sort: 'OrganizationName'
            }
        });

        return testSort(getOrgs, 'OrganizationName', true);

    });

    it('should allow sorting by OrganizationName descending', function () {
        let getOrgs = functionRunner.runFunction('getOrganizations', null, {
            querystring: {
                sort: '-OrganizationName'
            }
        });

        return testSort(getOrgs, 'OrganizationName', false);

    });

    it('should allow sorting by CreatedAt ascending', function () {
        let getOrgs = functionRunner.runFunction('getOrganizations', null, {
            querystring: {
                sort: 'CreatedAt'
            }
        });

        return testSort(getOrgs, 'CreatedAt', true);

    });

    it('should allow sorting by CreatedAt descending', function () {
        let getOrgs = functionRunner.runFunction('getOrganizations', null, {
            querystring: {
                sort: '-CreatedAt'
            }
        });

        return testSort(getOrgs, 'CreatedAt', false);

    });

    it('should allow sorting by UpdatedAt ascending', function () {
        let getOrgs = functionRunner.runFunction('getOrganizations', null, {
            querystring: {
                sort: 'UpdatedAt'
            }
        });

        return testSort(getOrgs, 'UpdatedAt', true);

    });

    it('should allow sorting by UpdatedAt descending', function () {
        let getOrgs = functionRunner.runFunction('getOrganizations', null, {
            querystring: {
                sort: '-UpdatedAt'
            }
        });

        return testSort(getOrgs, 'UpdatedAt', false);

    });

    it('should not allow sorting of invalid fields', function () {
        let getOrgs = functionRunner.runFunction('getOrganizations', null, {
            querystring: {
                sort: 'Foo'
            }
        });

        return expect(getOrgs).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: "Invalid sort: Foo"
        }));
    });

});