'use strict';
const expect = require('chai').expect;
const chai = require('chai');
const chaiDateTime = require('chai-datetime');
chai.use(chaiDateTime);
const functionRunner = require('../../functionRunner.js');
const env = require('../../../functions/lib/env.js').withMockContext();
const databaseHelper = require('../../../functions/lib/helpers/databaseHelper.js').withEnv(env);
const Model = require('../../../functions/lib/models/Model.js').withEnv(env);

const util = {
    object: require('../../../functions/lib/util/object.js'),
    testing: require('../../../functions/lib/util/testing.js')
};

// used to set initial value of CreatedAt/UpdatedAt so their values after an update can be easily checked
const initialTimestamp = (env.getEnv() === 'devlocal') ? '2016-06-29 07:00' : '2016-06-29T07:00';

let firstOrg = {
    OrganizationID: "55555",
    ExternalID: "66666",
    OrganizationName: "Hello",
    OrganizationType: "school"
};

let secondOrg = {
    OrganizationID: "44444",
    ParentOrganizationID: '55555',
    ExternalID: "66666",
    OrganizationName: "Hello",
    OrganizationType: "school"
};

let timestamps = {
    CreatedAt: initialTimestamp,
    UpdatedAt: initialTimestamp
};

let firstOrgWithTimestamps = util.object.deepMerge(util.object.deepCopy(firstOrg), timestamps);

const additionalFields = [
    'Active',
    'CreatedAt',
    'UpdatedAt'
];

describe('updateOrganization', function () {
    beforeEach(function () {
        return databaseHelper.getQueryBuilder().then(knex => {
            return knex('organization').insert(firstOrgWithTimestamps);
        });
    });

    afterEach(function () {
        return databaseHelper.getQueryBuilder().then(knex => {
            return knex('organization').del();
        });
    });

    it('should return a 404 if the organizationId specified in the path does not exist', function() {
        const updateOrg = functionRunner.runFunction('updateOrganization', {
            OrganizationName: "Goodbye"
        }, {
            path: {
                id: '00000'
            }
        });

        return expect(updateOrg).to.be.rejectedWith(JSON.stringify({
            responseCode: 404,
            errorMessage: "Invalid OrganizationID"
        }));
    });

    it('should not allow changes to OrganizationID', function() {
        const updateOrg = functionRunner.runFunction('updateOrganization', {
            OrganizationID: "66666"
        }, {
            path: {
                id: '55555'
            }
        });

        return expect(updateOrg).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: "Cannot update OrganizationID"
        }));
    });

    it('should not allow badly-named fields', function() {
        const updateOrg = functionRunner.runFunction('updateOrganization', {
            OrganizationZZZZ: "66666"
        }, {
            path: {
                id: '55555'
            }
        });

        return expect(updateOrg).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: "Invalid field: OrganizationZZZZ"
        }));
    });

    it('if OrganizationType is specified, it cannot be empty', function() {
        const updateOrg = functionRunner.runFunction('updateOrganization', {
            OrganizationType: null
        }, {
            path: {
                id: '55555'
            }
        });

        return expect(updateOrg).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'Missing required value: OrganizationType'
        }));
    });

    it('if OrganizationName is specified, it cannot be empty', function() {
        const updateOrg = functionRunner.runFunction('updateOrganization', {
            OrganizationName: null
        }, {
            path: {
                id: '55555'
            }
        });

        return expect(updateOrg).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'Missing required value: OrganizationName'
        }));
    });

    it('if ExternalID is specified, it cannot be empty', function() {
        const updateOrg = functionRunner.runFunction('updateOrganization', {
            ExternalID: null
        }, {
            path: {
                id: '55555'
            }
        });

        return expect(updateOrg).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'Missing required value: ExternalID'
        }));
    });

    it('should not allow Organization Name of length > 80 characters', function () {
        const updateOrg = functionRunner.runFunction('updateOrganization', {
            OrganizationName: 'a'.repeat(81)
        }, {
            path: {
                id: '55555'
            }
        });

        return expect(updateOrg).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'OrganizationName exceeds maximum length of 80 characters'
        }));
    });

    it('should allow Organization Name of length <= 80 characters', function () {

        let updates = {
            OrganizationName: 'a'.repeat(80)
        };
        let firstOrgCopy = util.object.deepCopy(firstOrg);
        let results = util.object.deepMerge(firstOrgCopy, updates);

        const updateOrg = functionRunner.runFunction('updateOrganization', updates, {
            path: {
                id: '55555'
            }
        });

        return Promise.all([
            expect(updateOrg).to.be.fulfilled,
            util.testing.expect(expect, updateOrg).toHaveProperties(results, additionalFields)
        ]);
    });

    it('should not allow Organization Type of length > 35 characters', function () {
        const updateOrg = functionRunner.runFunction('updateOrganization', {
            OrganizationType: 'a'.repeat(36)
        }, {
            path: {
                id: '55555'
            }
        });

        return expect(updateOrg).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'OrganizationType exceeds maximum length of 35 characters'
        }));
    });

    it('should allow Organization Name of length <= 35 characters', function () {
        let updates = {
            OrganizationType: 'a'.repeat(35)
        };
        let firstOrgCopy = util.object.deepCopy(firstOrg);
        let results = util.object.deepMerge(firstOrgCopy, updates);

        const updateOrg = functionRunner.runFunction('updateOrganization', updates, {
            path: {
                id: '55555'
            }
        });

        return Promise.all([
            expect(updateOrg).to.be.fulfilled,
            util.testing.expect(expect, updateOrg).toHaveProperties(results, additionalFields)
        ]);
    });

    it('should not allow External ID of length > 30 characters', function () {
        const updateOrg = functionRunner.runFunction('updateOrganization', {
            ExternalID: 'a'.repeat(31)
        }, {
            path: {
                id: '55555'
            }
        });

        return expect(updateOrg).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'ExternalID exceeds maximum length of 30 characters'
        }));
    });

    it('should allow External ID of length <= 30 characters', function () {
        let updates = {
            ExternalID: 'a'.repeat(30)
        };
        let firstOrgCopy = util.object.deepCopy(firstOrg);
        let results = util.object.deepMerge(firstOrgCopy, updates);


        const updateOrg = functionRunner.runFunction('updateOrganization', {
            ExternalID: 'a'.repeat(30)
        }, {
            path: {
                id: '55555'
            }
        });

        return Promise.all([
            expect(updateOrg).to.be.fulfilled,
            util.testing.expect(expect, updateOrg).toHaveProperties(results, additionalFields)
        ]);
    });

    it('should not allow the ParentOrganizationID to be set to its own OrganizaitonID', function () {
        let createSecondOrg = databaseHelper.getQueryBuilder().then(knex => {
            return knex('organization').insert(secondOrg);
        }).then(() => {
            return functionRunner.runFunction('updateOrganization', {
                ParentOrganizationID: '44444'
            }, {
                path: {
                    id: '44444'
                }
            });
        });

        return expect(createSecondOrg).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'Organization must not be a parent of itself'
        }));
    });

    it('should not allow an object without any fields', function () {
        const updateOrg = functionRunner.runFunction('updateOrganization', {}, {
            path: {
                id: '55555'
            }
        });

        return expect(updateOrg).to.be.rejectedWith(JSON.stringify({
            responseCode: 400,
            errorMessage: 'No valid fields provided'
        }));
    });

    it('should allow multiple, well-formed updates', function () {
        let updates = {
            ExternalID: "99999",
            OrganizationType: "district",
            OrganizationName: "different name"
        };

        let firstOrgCopy = util.object.deepCopy(firstOrg);
        let results = util.object.deepMerge(firstOrgCopy, updates);

        const updateOrg = functionRunner.runFunction('updateOrganization', updates , {
            path: {
                id: '55555'
            }
        });

        return Promise.all([
            expect(updateOrg).to.be.fulfilled,
            util.testing.expect(expect, updateOrg).toHaveProperties(results, additionalFields)
        ]);
    });

    it('should not update CreatedAt', function () {
        let updates = {
            ExternalID: "99999"
        };

        const updateOrg = functionRunner.runFunction('updateOrganization', updates , {
            path: {
                id: '55555'
            }
        });

        return Promise.resolve(updateOrg)
        .then(updatedOrg => {
            return expect(new Date(updatedOrg.CreatedAt)).to.equalTime(new Date(initialTimestamp));
        });
    });

    it('should update UpdatedAt', function () {
        let updates = {
            ExternalID: "99999"
        };

        const updateOrg = functionRunner.runFunction('updateOrganization', updates , {
            path: {
                id: '55555'
            }
        });

        return Promise.resolve(updateOrg)
        .then(updatedOrg => {
            return expect(new Date(updatedOrg.UpdatedAt)).to.afterTime(new Date(initialTimestamp));
        });
    });

    describe('when updating the root org', function () {
        it('should not allow updates to the ParentOrganizationID', function() {
            let updateOrg = functionRunner.runFunction('updateOrganization', {
                ParentOrganizationID: "98765"
            }, {
                path: {
                    id: '55555'
                }
            });

            return expect(updateOrg).to.be.rejectedWith(JSON.stringify({
                responseCode: 400,
                errorMessage: "Root-level organization cannot change its parent org"
            }));
        });
    });

    describe('when updating a non-root org', function() {
        beforeEach(function() {
            return Model.getClass('Organization').then(Organization => {
                return (new Organization()).save({
                    ParentOrganizationID: "55555",
                    OrganizationID: "66666",
                    OrganizationName: "Another Org",
                    ExternalID: "00000",
                    OrganizationType: "school"
                });
            });
        });

        it('should allow an update to the ParentOrgID', function () {
            const makeAnotherOrg = Model.getClass('Organization').then(Organization => {
                return (new Organization()).save({
                    ParentOrganizationID: "55555",
                    OrganizationID: "77777",
                    OrganizationName: "A Third Org",
                    ExternalID: "00000",
                    OrganizationType: "school"
                });
            });


            const updateOrg = makeAnotherOrg.then(() => {
                return functionRunner.runFunction('updateOrganization', {
                    ParentOrganizationID: "77777"
                }, {
                    path: {
                        id: '66666'
                    }
                });
            });

            return expect(updateOrg).to.be.fulfilled.and.eventually.have.property('ParentOrganizationID', '77777');
        });
    });
});