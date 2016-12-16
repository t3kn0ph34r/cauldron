'use strict';
const expect = require('chai').expect;
const env = require('../../../functions/lib/env.js').withMockContext();
const databaseHelper = require('../../../functions/lib/helpers/databaseHelper.js').withEnv(env);
const stringUtil = require('../../../functions/lib/util/string.js');
const functionRunner = require('../../functionRunner.js');

describe('getOrganizations - filtered', function () {
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


    // Within the list of 250 orgs,
    // 150 are inactive,
    // 150 have org names that contain the substring 'AAAAAAA', and
    // 150 have a ParentOrganizationID set as the fifth OrganizationID, which is not the root. (using an org that will not create a circular hierarchy)
    // in each of the latter two sets, 50 orgs are active and 100 are inactive.
    //
    // The intersection between these two sets of orgs is 50 for active, and 50 for inactive.

    let otherParentOrgId = organizations[5].OrganizationID;
    for (let i = 0; i < organizations.length; i++) {

        if ([1,2,3].indexOf(i % 5) !== -1) {
            organizations[i].ParentOrganizationID = otherParentOrgId;
        }

        if ([2,3,4].indexOf(i % 5) !== -1) {
            // replace the string with "AAAAAAA" at index 10
            organizations[i].OrganizationName = replaceStringAtPosition(organizations[i].OrganizationName, stringToFind, 10);
        }

        if ([1,3,4].indexOf(i % 5) !== -1) {
            organizations[i].Active = 0;
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

    it('should only return active results by default', function () {
        let getOrgs = functionRunner.runFunction('getOrganizations');

        let filteredOrgs = organizations.filter(organization => {
            return organization.Active;
        });

        return Promise.all([
            expect(getOrgs).to.be.fulfilled,
            expect(getOrgs).to.eventually.have.deep.property('models[0].OrganizationID', filteredOrgs[0].OrganizationID),
            expect(getOrgs).to.eventually.have.deep.property('models[49].OrganizationID', filteredOrgs[49].OrganizationID),
            expect(getOrgs).to.eventually.have.deep.property('pagination.offset', 0),
            expect(getOrgs).to.eventually.have.deep.property('pagination.limit', 50),
            expect(getOrgs).to.eventually.have.deep.property('pagination.rowCount', filteredOrgs.length),
            expect(getOrgs).to.eventually.have.lengthOf(50)
        ]);
    });

    it('return inactive organizations if Active is false', function () {
        let getOrgs = functionRunner.runFunction('getOrganizations', null, {
            querystring: {
                Active: 'false'
            }
        }).then(data => {
            return data;
        });

        let filteredOrgs = organizations.filter(organization => {
            return !organization.Active;
        });

        return Promise.all([
            expect(getOrgs).to.be.fulfilled,
            expect(getOrgs).to.eventually.have.deep.property('models[0].OrganizationID', filteredOrgs[0].OrganizationID),
            expect(getOrgs).to.eventually.have.deep.property('models[49].OrganizationID', filteredOrgs[49].OrganizationID),
            expect(getOrgs).to.eventually.have.deep.property('pagination.offset', 0),
            expect(getOrgs).to.eventually.have.deep.property('pagination.limit', 50),
            expect(getOrgs).to.eventually.have.deep.property('pagination.rowCount', filteredOrgs.length),
            expect(getOrgs).to.eventually.have.lengthOf(50)
        ]);
    });

    it('should get a filtered list based on a substring search on a given value for OrganizationName', function () {
        let getOrgs = functionRunner.runFunction('getOrganizations', null, {
            querystring: {
                OrganizationName: stringToFind
            }
        });

        let filteredOrgs = organizations.filter(organization => {
            return organization.OrganizationName.indexOf(stringToFind) !== -1 && organization.Active;
        });

        return Promise.all([
            expect(getOrgs).to.be.fulfilled,
            expect(getOrgs).to.eventually.have.deep.property('models[0].OrganizationID', filteredOrgs[0].OrganizationID),
            expect(getOrgs).to.eventually.have.deep.property('models[49].OrganizationID', filteredOrgs[49].OrganizationID),
            expect(getOrgs).to.eventually.have.deep.property('pagination.offset', 0),
            expect(getOrgs).to.eventually.have.deep.property('pagination.limit', 50),
            expect(getOrgs).to.eventually.have.deep.property('pagination.rowCount', filteredOrgs.length),
            expect(getOrgs).to.eventually.have.lengthOf(50)
        ]);
    });

    it('should get a filtered list based on an exact search on a given value for ParentOrganizationID', function () {
        let getOrgs = functionRunner.runFunction('getOrganizations', null, {
            querystring: {
                ParentOrganizationID: otherParentOrgId
            }
        });


        let filteredOrgs =  organizations.filter(organization => {
            return organization.ParentOrganizationID === otherParentOrgId && organization.Active;
        });

        return Promise.all([
            expect(getOrgs).to.be.fulfilled,
            expect(getOrgs).to.eventually.have.deep.property('models[0].OrganizationID', filteredOrgs[0].OrganizationID),
            expect(getOrgs).to.eventually.have.deep.property('models[49].OrganizationID', filteredOrgs[49].OrganizationID),
            expect(getOrgs).to.eventually.have.deep.property('pagination.offset', 0),
            expect(getOrgs).to.eventually.have.deep.property('pagination.limit', 50),
            expect(getOrgs).to.eventually.have.deep.property('pagination.rowCount', filteredOrgs.length),
            expect(getOrgs).to.eventually.have.lengthOf(50)
        ]);
    });

    it('should ignore case when searching', function () {
        let getOrgs = functionRunner.runFunction('getOrganizations', null, {
            querystring: {
                ParentOrganizationID: otherParentOrgId.toLowerCase(),
                OrganizationName: stringToFind.toLowerCase()
            }
        });


        let filteredOrgs =  organizations.filter(organization => {
            return (
                organization.ParentOrganizationID === otherParentOrgId &&
                organization.OrganizationName.indexOf(stringToFind) !== -1 &&
                organization.Active
            );
        });

        return Promise.all([
            expect(getOrgs).to.be.fulfilled,
            expect(getOrgs).to.eventually.have.deep.property('models[0].OrganizationID', filteredOrgs[0].OrganizationID),
            expect(getOrgs).to.eventually.have.deep.property('models[49].OrganizationID', filteredOrgs[49].OrganizationID),
            expect(getOrgs).to.eventually.have.deep.property('pagination.offset', 0),
            expect(getOrgs).to.eventually.have.deep.property('pagination.limit', 50),
            expect(getOrgs).to.eventually.have.deep.property('pagination.rowCount', filteredOrgs.length),
            expect(getOrgs).to.eventually.have.lengthOf(50)
        ]);
    });

    it('should get a filtered list based on both ParentOrganizationID and OrganizationName', function () {
        let getOrgs = functionRunner.runFunction('getOrganizations', null, {
            querystring: {
                ParentOrganizationID: otherParentOrgId,
                OrganizationName: stringToFind
            }
        });


        let filteredOrgs =  organizations.filter(organization => {
            return (
                organization.ParentOrganizationID === otherParentOrgId &&
                organization.OrganizationName.indexOf(stringToFind) !== -1 &&
                organization.Active
            );
        });

        return Promise.all([
            expect(getOrgs).to.be.fulfilled,
            expect(getOrgs).to.eventually.have.deep.property('models[0].OrganizationID', filteredOrgs[0].OrganizationID),
            expect(getOrgs).to.eventually.have.deep.property('models[49].OrganizationID', filteredOrgs[49].OrganizationID),
            expect(getOrgs).to.eventually.have.deep.property('pagination.offset', 0),
            expect(getOrgs).to.eventually.have.deep.property('pagination.limit', 50),
            expect(getOrgs).to.eventually.have.deep.property('pagination.rowCount', filteredOrgs.length),
            expect(getOrgs).to.eventually.have.lengthOf(50)
        ]);
    });

    it('should get a filtered list based on ParentOrganizationID, OrganizationName, and Active', function () {
        let getOrgs = functionRunner.runFunction('getOrganizations', null, {
            querystring: {
                ParentOrganizationID: otherParentOrgId,
                OrganizationName: stringToFind,
                Active: 'false'
            }
        });


        let filteredOrgs =  organizations.filter(organization => {
            return (
                organization.ParentOrganizationID === otherParentOrgId &&
                organization.OrganizationName.indexOf(stringToFind) !== -1 &&
                !organization.Active
            );
        });

        return Promise.all([
            expect(getOrgs).to.be.fulfilled,
            expect(getOrgs).to.eventually.have.deep.property('models[0].OrganizationID', filteredOrgs[0].OrganizationID),
            expect(getOrgs).to.eventually.have.deep.property('models[49].OrganizationID', filteredOrgs[49].OrganizationID),
            expect(getOrgs).to.eventually.have.deep.property('pagination.offset', 0),
            expect(getOrgs).to.eventually.have.deep.property('pagination.limit', 50),
            expect(getOrgs).to.eventually.have.deep.property('pagination.rowCount', filteredOrgs.length),
            expect(getOrgs).to.eventually.have.lengthOf(50)
        ]);
    });

    it('should not allow non-boolean values for Active', function() {
        let getOrgs = functionRunner.runFunction('getOrganizations', null, {
            querystring: {
                Active: "foo"
            }
        });

        return expect(getOrgs).to.be.rejectedWith(JSON.stringify({
            "responseCode": 400,
            "errorMessage": "Active must be a boolean value"
        }));
    });

    it('should not allow invalid field names', function () {

        let getOrgs = functionRunner.runFunction('getOrganizations', null, {
            querystring: {
                OrganizationID: "12345"
            }
        });

        return expect(getOrgs).to.be.rejectedWith(JSON.stringify({
            "responseCode": 400,
            "errorMessage": "Invalid filter: OrganizationID"
        }));
    });



    it('should return a 404 if the filter returns no results', function () {

        let getOrgs = functionRunner.runFunction('getOrganizations', null, {
            querystring: {
                ParentOrganizationID: "12345"
            }
        });

        return expect(getOrgs).to.be.rejectedWith(JSON.stringify({
            "responseCode": 404,
            "errorMessage": "Page not found"
        }));
    });
});