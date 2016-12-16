'use strict';
const sinon = require('sinon');
const expect = require('chai').expect;
const env = require('../../../functions/lib/env.js').withMockContext();
const databaseHelper = require('../../../functions/lib/helpers/databaseHelper.js').withEnv(env);
const Model = require('../../../functions/lib/models/Model.js').withEnv(env);

describe('Organizations Unit Tests', function () {

    describe('rootOrgExists', function () {

        it('should return true when knex returns a truthy value', sinon.test(function () {
            return Model.getClass('Organization').then(Organization => {
                let organization = new Organization();

                let sandbox = sinon.sandbox.create();

                // An ugly way to stub the behavior of the knex call to the 'Organizations' table
                sandbox.stub(databaseHelper, 'getQueryBuilder').returns(
                    {
                        then: function () {
                            return new Promise(function (fulfill, reject) {
                                fulfill(true);
                            });
                        }
                    }
                );

                return organization.rootOrgExists().then(result => {
                    // Restore the sandbox because the scope of 'databaseHelper' is not limited to this test
                    sandbox.restore();
                    return expect(result).to.equal(true);
                });
            });
        }));

        it('should return false when knex returns a falsey value', sinon.test(function () {
            return Model.getClass('Organization').then(Organization => {
                let organization = new Organization();

                let sandbox = sinon.sandbox.create();

                // An ugly way to stub the behavior of the knex call to the 'Organizations' table
                sandbox.stub(databaseHelper, 'getQueryBuilder').returns(
                    {
                        then: function () {
                            return new Promise(function (fulfill, reject) {
                                fulfill(false);
                            });
                        }
                    }
                );

                return organization.rootOrgExists().then(result => {
                    // Restore the sandbox because the scope of 'databaseHelper' is not limited to this test
                    sandbox.restore();
                    return expect(result).to.equal(false);
                });
            });
        }));
    });

    describe('notSelfParentOrganizationId', function () {

        it('should return true when OrganizationID doesn\'t match given value', function () {
            return Model.getClass('Organization').then(Organization => {
                let organization = new Organization();
                organization.attributes.OrganizationID = 'Org1234';

                return expect(organization.notSelfParentOrganizationId('Org54321')).to.equal(true);
            });
        });

        it('should return false when OrganizationID matches given value', function () {
            return Model.getClass('Organization').then(Organization => {
                let organization = new Organization();
                let orgId = 'Org12345';
                organization.attributes.OrganizationID = orgId;

                return expect(organization.notSelfParentOrganizationId(orgId)).to.equal(false);
            });
        });
    });

    describe('creatingAndRootOrgExists', function () {

        it('should return false if OrganizationID already exists', function () {
            return Model.getClass('Organization').then(Organization => {
                let organization = new Organization();

                // Create sandbox so stubs don't affect other tests
                let sandbox = sinon.sandbox.create();

                // Set functionality of 'previous' function
                sandbox.stub(organization, 'previous').throws('Wrong parameter passed')
                    .withArgs('OrganizationID')
                    .returns(true);
                sandbox.stub(organization, 'rootOrgExists').throws('Should not be reached');

                return expect(organization.creatingAndRootOrgExists()).to.equal(false);
            });
        });

        it('should return false if OrganizationID and root Org don\'t exist', function () {
            return Model.getClass('Organization').then(Organization => {
                let organization = new Organization();

                // Set functionality of 'previous' and 'rootOrgExists' functions
                let sandbox = sinon.sandbox.create();
                sandbox.stub(organization, 'previous').throws('Wrong parameter passed')
                    .withArgs('OrganizationID')
                    .returns(false);
                sandbox.stub(organization, 'rootOrgExists').returns(false);

                return expect(organization.creatingAndRootOrgExists()).to.equal(false);
            });
        });

        it('should return true if OrganizationID doesn\'t exist but root org does', function () {
            return Model.getClass('Organization').then(Organization => {
                let organization = new Organization();

                // Set functionality of 'previous' and 'rootOrgExists' functions
                let sandbox = sinon.sandbox.create();
                sandbox.stub(organization, 'previous').throws('Wrong parameter passed')
                    .withArgs('OrganizationID')
                    .returns(false);
                sandbox.stub(organization, 'rootOrgExists').returns(true);

                return expect(organization.creatingAndRootOrgExists()).to.equal(true);
            });
        });
    });

    describe('rootOrgNotExists', function () {

        it('should return false if the root org exists', function () {
            return Model.getClass('Organization').then(Organization => {
                let organization = new Organization();
                let sandbox = sinon.sandbox.create();

                sandbox.stub(organization, 'rootOrgExists').returns(new Promise(function (fulfill, reject) {
                    fulfill(true);
                }));

                return organization.rootOrgNotExists().then(result => {
                    return expect(result).to.equal(false);
                });
            });
        });

        it('should return true if the root org doesn\'t exist', function () {
            return Model.getClass('Organization').then(Organization => {
                let organization = new Organization();
                let sandbox = sinon.sandbox.create();

                sandbox.stub(organization, 'rootOrgExists').returns(new Promise(function (fulfill, reject) {
                    fulfill(false);
                }));

                return organization.rootOrgNotExists().then(result => {
                    return expect(result).to.equal(true);
                });
            });
        });
    });

    describe('parentOrgExists', function () {

        it('should return true if the parent org is not falsey', function () {
            return Model.getClass('Organization').then(Organization => {
                let organization = new Organization();
                let sandbox = sinon.sandbox.create();

                sandbox.stub(organization, 'parentOrganization').returns(
                    {
                        fetch: function () {
                            return new Promise(function (fulfill, reject) {
                                fulfill(true);
                            });
                        }
                    }
                );

                return organization.parentOrgExists().then(result => {
                    return expect(result).to.equal(true);
                });
            });
        });

        it('should throw an error if the parent org is not truthy', function () {
            return Model.getClass('Organization').then(Organization => {
                let organization = new Organization();
                let sandbox = sinon.sandbox.create();

                sandbox.stub(organization, 'parentOrganization').returns({
                    fetch: function () {
                        return new Promise(function (fulfill, reject) {
                            fulfill(false);
                        });
                    }
                });

                return organization.parentOrgExists().then(result => {
                    return expect(true).to.equal(false, 'messageee');
                }).catch(e => {
                    return expect(e.message).to.equal(JSON.stringify({
                        responseCode: 400,
                        errorMessage: 'Invalid ParentOrganizationID'
                    }));
                });
            });
        });
    });
});